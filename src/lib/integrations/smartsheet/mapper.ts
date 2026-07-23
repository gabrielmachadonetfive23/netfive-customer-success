import type { CustomerDTO } from "@/lib/types";
import { SYNC_FIELDS } from "@/lib/integrations/field-mapping";
import { getSheetColumns, type SmartsheetCell, type SmartsheetRow } from "@/lib/integrations/smartsheet/client";

function toCellValue(customer: CustomerDTO, key: (typeof SYNC_FIELDS)[number]["key"]): string | number | null {
  if (key === "services") {
    return customer.services.map((s) => s.name).join(", ");
  }
  const value = customer[key];
  if (value === null || value === undefined) return null;
  return value as string | number;
}

/** Converte um cliente em células Smartsheet, casando pelo título da coluna configurado em field-mapping.ts. */
export async function customerToSmartsheetCells(customer: CustomerDTO): Promise<SmartsheetCell[]> {
  const columns = await getSheetColumns();
  const columnByTitle = new Map(columns.map((c) => [c.title, c.id]));

  const cells: SmartsheetCell[] = [];
  for (const field of SYNC_FIELDS) {
    const columnId = columnByTitle.get(field.externalName);
    if (columnId === undefined) continue; // coluna ainda não existe no sheet do usuário — ignora silenciosamente
    cells.push({ columnId, value: toCellValue(customer, field.key) });
  }
  return cells;
}

/** Converte uma linha do Smartsheet em um mapa de valores planos (nome do campo -> valor), pronto para aplicar em um Customer. */
export async function smartsheetRowToFieldValues(row: SmartsheetRow): Promise<Partial<Record<string, string | number | null>>> {
  const columns = await getSheetColumns();
  const columnTitleById = new Map(columns.map((c) => [c.id, c.title]));

  const fieldByExternalName = new Map(SYNC_FIELDS.map((f) => [f.externalName, f]));
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
