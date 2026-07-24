import type { CustomerDTO } from "@/lib/types";
import { SMARTSHEET_SYNC_FIELDS } from "@/lib/integrations/field-mapping";
import { getSheetColumns, type SmartsheetCell, type SmartsheetColumn, type SmartsheetRow } from "@/lib/integrations/smartsheet/client";

function toCellValues(customer: CustomerDTO, key: (typeof SMARTSHEET_SYNC_FIELDS)[number]["key"]): string[] {
  if (key === "services") {
    return customer.services.map((s) => s.name);
  }
  const value = customer[key];
  if (value === null || value === undefined) return [];
  return [String(value)];
}

/**
 * Converte um cliente em células Smartsheet, casando pelo título da coluna
 * configurado em field-mapping.ts. Colunas do tipo MULTI_PICKLIST (seleção
 * múltipla, ex.: "Categoria" e "Escopo Contratado" nessa planilha) exigem
 * objectValue em vez de value — ver client.ts.
 */
export async function customerToSmartsheetCells(customer: CustomerDTO): Promise<SmartsheetCell[]> {
  const columns = await getSheetColumns();
  const columnByTitle = new Map<string, SmartsheetColumn>(columns.map((c) => [c.title, c]));

  const cells: SmartsheetCell[] = [];
  for (const field of SMARTSHEET_SYNC_FIELDS) {
    const column = columnByTitle.get(field.externalName);
    if (!column) continue; // coluna ainda não existe no sheet do usuário — ignora silenciosamente

    const values = toCellValues(customer, field.key);

    // Colunas com lista de valores restrita rejeitam `value` puro com
    // CELL_VALUE_FAILS_VALIDATION, mesmo quando a API reporta o tipo como
    // TEXT_NUMBER (é o caso de "Categoria" e "Escopo Contratado" nessa
    // planilha) — exigem objectValue. PICKLIST "de verdade" (ex.: "CS")
    // aceita value puro normalmente.
    const needsObjectValue = column.type !== "PICKLIST" && Boolean(column.options?.length);

    if (needsObjectValue && values.length > 0) {
      cells.push({ columnId: column.id, objectValue: { objectType: "MULTI_PICKLIST", values } });
    } else {
      // values vazio: limpa a célula (um objectValue com values: [] é rejeitado pela API).
      cells.push({ columnId: column.id, value: values.length > 0 ? values.join(", ") : null });
    }
  }
  return cells;
}

/** Converte uma linha do Smartsheet em um mapa de valores planos (nome do campo -> valor), pronto para aplicar em um Customer. */
export async function smartsheetRowToFieldValues(row: SmartsheetRow): Promise<Partial<Record<string, string | number | null>>> {
  const columns = await getSheetColumns();
  const columnTitleById = new Map(columns.map((c) => [c.id, c.title]));

  const fieldByExternalName = new Map(SMARTSHEET_SYNC_FIELDS.map((f) => [f.externalName, f]));
  const values: Record<string, string | number | null> = {};

  for (const cell of row.cells) {
    const title = columnTitleById.get(cell.columnId);
    if (!title) continue;
    const field = fieldByExternalName.get(title);
    if (!field) continue;
    values[field.key] = (cell.value ?? null) as string | number | null;
  }

  return values;
}
