import type { CustomerDTO } from "@/lib/types";
import { PIPEDRIVE_SYNC_FIELDS } from "@/lib/integrations/field-mapping";
import { getOrganizationFields, type PipedriveOrganization } from "@/lib/integrations/pipedrive/client";

function toFieldValue(customer: CustomerDTO, key: (typeof PIPEDRIVE_SYNC_FIELDS)[number]["key"]): string | number | null {
  if (key === "services") {
    return customer.services.map((s) => s.name).join(", ");
  }
  const value = customer[key];
  if (value === null || value === undefined) return null;
  return value as string | number;
}

/** Converte um cliente nos campos de Organização do Pipedrive (padrão "name" + campos customizados por nome). */
export async function customerToPipedriveFields(
  customer: CustomerDTO,
): Promise<Record<string, string | number | null>> {
  const customFields = await getOrganizationFields();
  const keyByName = new Map(customFields.map((f) => [f.name, f.key]));

  const fields: Record<string, string | number | null> = { name: customer.companyName };

  for (const field of PIPEDRIVE_SYNC_FIELDS) {
    if (field.key === "companyName") continue; // já mapeado para o campo padrão "name"
    const fieldKey = keyByName.get(field.externalName);
    if (!fieldKey) continue; // campo customizado ainda não existe na conta Pipedrive — ignora silenciosamente
    fields[fieldKey] = toFieldValue(customer, field.key);
  }

  return fields;
}

/** Converte uma organização do Pipedrive em um mapa de valores planos (nome do campo -> valor). */
export async function pipedriveOrganizationToFieldValues(
  organization: PipedriveOrganization,
): Promise<Partial<Record<string, string | number | null>>> {
  const customFields = await getOrganizationFields();
  const nameByKey = new Map(customFields.map((f) => [f.key, f.name]));
  const fieldByExternalName = new Map(PIPEDRIVE_SYNC_FIELDS.map((f) => [f.externalName, f]));

  const values: Record<string, string | number | null> = {
    companyName: (organization.name as string) ?? null,
  };

  for (const [key, rawValue] of Object.entries(organization)) {
    const externalName = nameByKey.get(key);
    if (!externalName) continue;
    const field = fieldByExternalName.get(externalName);
    if (!field) continue;
    values[field.key] = (rawValue ?? null) as string | number | null;
  }

  return values;
}
