import { PIPEDRIVE_SYNC_FIELDS } from "@/lib/integrations/field-mapping";
import { getOrganizationFields, type PipedriveOrganization } from "@/lib/integrations/pipedrive/client";

/**
 * Converte uma organização do Pipedrive em um mapa de valores planos (nome
 * do campo -> valor). Usado apenas na leitura (webhook de atualização) — o
 * Pipedrive é somente leitura para escrita de cliente (ver sync-orchestrator.ts).
 */
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
