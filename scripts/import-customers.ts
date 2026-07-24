/**
 * Script de importação de clientes existentes (JSON, CSV ou XLSX).
 *
 * Uso:
 *   npm run import:customers -- ./caminho/para/arquivo.xlsx
 *
 * Regras aplicadas (ver README > Importação de dados):
 * - Nunca duplica clientes: usa um mapa de IDs antigos (scripts/import-legacy-id-map.json)
 *   e, na ausência de ID antigo, tenta casar pelo nome exato da empresa.
 * - Nunca apaga a base existente.
 * - Normaliza datas para ISO e nomes de serviços legados (ex.: grafia divergente).
 * - Preserva serviços antigos que não estão no catálogo oficial (cria como inativos).
 * - Gera um relatório com importados, ignorados e erros.
 *
 * As colunas de entrada (JSON/CSV/XLSX) devem usar os mesmos nomes definidos
 * em src/lib/integrations/field-mapping.ts (ex.: "Empresa", "CS Responsável",
 * "Categoria"...). Uma coluna adicional "ID Legado" (ou "legacyId") permite
 * mapear registros de sistemas antigos para reimportações idempotentes.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, extname } from "path";
import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { ALLOWED_CATEGORIES, normalizeServiceName } from "../src/lib/constants";
import { PIPEDRIVE_SYNC_FIELDS as SYNC_FIELDS } from "../src/lib/integrations/field-mapping";

const prisma = new PrismaClient();
const LEGACY_MAP_PATH = resolve(__dirname, "import-legacy-id-map.json");

type RawRow = Record<string, unknown>;

interface ImportReportEntry {
  legacyId?: string;
  companyName?: string;
  reason?: string;
}

interface ImportReport {
  imported: ImportReportEntry[];
  updated: ImportReportEntry[];
  skipped: ImportReportEntry[];
  errors: ImportReportEntry[];
}

function loadLegacyMap(): Record<string, string> {
  if (!existsSync(LEGACY_MAP_PATH)) return {};
  return JSON.parse(readFileSync(LEGACY_MAP_PATH, "utf-8")) as Record<string, string>;
}

function saveLegacyMap(map: Record<string, string>): void {
  writeFileSync(LEGACY_MAP_PATH, JSON.stringify(map, null, 2), "utf-8");
}

function readRows(filePath: string): RawRow[] {
  const ext = extname(filePath).toLowerCase();

  if (ext === ".json") {
    const content = JSON.parse(readFileSync(filePath, "utf-8"));
    if (!Array.isArray(content)) throw new Error("O arquivo JSON deve conter um array de objetos.");
    return content as RawRow[];
  }

  if (ext === ".csv") {
    const content = readFileSync(filePath, "utf-8");
    return parseCsv(content, { columns: true, skip_empty_lines: true, trim: true }) as RawRow[];
  }

  if (ext === ".xlsx" || ext === ".xls") {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) throw new Error("A planilha não contém abas.");
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) throw new Error("A primeira aba da planilha está vazia.");
    return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: null });
  }

  throw new Error(`Formato de arquivo não suportado: ${ext}. Use .json, .csv ou .xlsx.`);
}

function findValue(row: RawRow, candidates: string[]): unknown {
  for (const candidate of candidates) {
    if (row[candidate] !== undefined) return row[candidate];
  }
  return undefined;
}

function normalizeDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function extractServiceNames(row: RawRow): string[] {
  const raw = findValue(row, ["Serviços Contratados", "Serviços", "Servicos", "services"]);
  if (!raw) return [];
  const text = String(raw);
  return text
    .split(/[,;]/)
    .map((name) => normalizeServiceName(name.trim()))
    .filter((name) => name.length > 0);
}

async function resolveServiceIds(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const service = await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name, active: false }, // serviços legados não catalogados entram como inativos
    });
    ids.push(service.id);
  }
  return ids;
}

async function main(): Promise<void> {
  const filePathArg = process.argv[2];
  if (!filePathArg) {
    console.error("Uso: npm run import:customers -- ./caminho/para/arquivo.(json|csv|xlsx)");
    process.exit(1);
  }

  const filePath = resolve(filePathArg);
  const rows = readRows(filePath);
  const legacyMap = loadLegacyMap();

  const report: ImportReport = { imported: [], updated: [], skipped: [], errors: [] };

  for (const row of rows) {
    try {
      const legacyId = normalizeText(findValue(row, ["ID Legado", "legacyId", "ID", "Id"]));
      const companyName = normalizeText(findValue(row, ["Empresa", "companyName"]));
      const csOwner = normalizeText(findValue(row, ["CS Responsável", "csOwner"]));
      const categoryRaw = normalizeText(findValue(row, ["Categoria", "category"]));
      const category = ALLOWED_CATEGORIES.find((c) => c === categoryRaw);

      if (!companyName || !csOwner || !category) {
        report.errors.push({
          legacyId: legacyId ?? undefined,
          companyName: companyName ?? undefined,
          reason: "Campos obrigatórios ausentes ou categoria inválida (empresa, CS responsável, categoria).",
        });
        continue;
      }

      const scalarData: Record<string, unknown> = { companyName, csOwner, category };
      for (const field of SYNC_FIELDS) {
        if (field.kind === "services" || field.key === "companyName" || field.key === "csOwner" || field.key === "category") {
          continue;
        }
        const raw = findValue(row, [field.externalName, field.key]);
        if (raw === undefined) continue;

        if (field.kind === "date") scalarData[field.key] = normalizeDate(raw);
        else if (field.kind === "number") scalarData[field.key] = normalizeNumber(raw);
        else scalarData[field.key] = normalizeText(raw);
      }

      const serviceNames = extractServiceNames(row);
      const serviceIds = await resolveServiceIds(serviceNames);

      let customerId = legacyId ? legacyMap[legacyId] : undefined;

      if (!customerId) {
        const existingByName = await prisma.customer.findFirst({
          where: { companyName: { equals: companyName } },
        });
        customerId = existingByName?.id;
      }

      await prisma.$transaction(async (tx) => {
        if (customerId) {
          await tx.customer.update({ where: { id: customerId }, data: scalarData });
          await tx.customerService.deleteMany({ where: { customerId } });
          if (serviceIds.length > 0) {
            await tx.customerService.createMany({
              data: serviceIds.map((serviceId) => ({ customerId: customerId as string, serviceId })),
            });
          }
        } else {
          const created = await tx.customer.create({ data: scalarData as never });
          customerId = created.id;
          if (serviceIds.length > 0) {
            await tx.customerService.createMany({
              data: serviceIds.map((serviceId) => ({ customerId: created.id, serviceId })),
            });
          }
        }
      });

      if (legacyId && customerId) {
        legacyMap[legacyId] = customerId;
      }

      const wasUpdate = Boolean(legacyId && legacyMap[legacyId]);
      (wasUpdate ? report.updated : report.imported).push({ legacyId: legacyId ?? undefined, companyName });
    } catch (error) {
      report.errors.push({
        companyName: normalizeText(findValue(row, ["Empresa", "companyName"])) ?? undefined,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  saveLegacyMap(legacyMap);

  const reportPath = resolve(__dirname, `import-report-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("Importação concluída.");
  console.log(`  Criados: ${report.imported.length}`);
  console.log(`  Atualizados: ${report.updated.length}`);
  console.log(`  Ignorados: ${report.skipped.length}`);
  console.log(`  Erros: ${report.errors.length}`);
  console.log(`Relatório completo salvo em: ${reportPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
