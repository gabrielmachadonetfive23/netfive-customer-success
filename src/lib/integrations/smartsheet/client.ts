import { createHmac, timingSafeEqual } from "crypto";

const SMARTSHEET_API_BASE = "https://api.smartsheet.com/2.0";

export interface SmartsheetColumn {
  id: number;
  title: string;
}

export interface SmartsheetCell {
  columnId: number;
  value?: string | number | boolean | null;
  displayValue?: string | null;
}

export interface SmartsheetRow {
  id: number;
  modifiedAt: string;
  cells: SmartsheetCell[];
}

function getConfig() {
  const token = process.env.SMARTSHEET_API_TOKEN;
  const sheetId = process.env.SMARTSHEET_SHEET_ID;
  if (!token || !sheetId) {
    throw new Error("SMARTSHEET_API_TOKEN ou SMARTSHEET_SHEET_ID não configurados.");
  }
  return { token, sheetId };
}

async function smartsheetRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { token } = getConfig();
  const response = await fetch(`${SMARTSHEET_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Smartsheet API ${response.status}: ${body.slice(0, 500)}`);
  }

  return response.json() as Promise<T>;
}

let columnsCache: { columns: SmartsheetColumn[]; fetchedAt: number } | null = null;
const COLUMN_CACHE_TTL_MS = 5 * 60 * 1000;

/** Colunas do sheet configurado, com cache curto para evitar chamadas repetidas. */
export async function getSheetColumns(): Promise<SmartsheetColumn[]> {
  if (columnsCache && Date.now() - columnsCache.fetchedAt < COLUMN_CACHE_TTL_MS) {
    return columnsCache.columns;
  }

  const { sheetId } = getConfig();
  const sheet = await smartsheetRequest<{ columns: SmartsheetColumn[] }>(
    `/sheets/${sheetId}?include=columnType`,
  );
  columnsCache = { columns: sheet.columns, fetchedAt: Date.now() };
  return sheet.columns;
}

export async function getRow(rowId: string): Promise<SmartsheetRow> {
  const { sheetId } = getConfig();
  return smartsheetRequest<SmartsheetRow>(`/sheets/${sheetId}/rows/${rowId}`);
}

export async function createRow(cells: SmartsheetCell[]): Promise<SmartsheetRow> {
  const { sheetId } = getConfig();
  const result = await smartsheetRequest<{ result: SmartsheetRow[] }>(`/sheets/${sheetId}/rows`, {
    method: "POST",
    body: JSON.stringify([{ toBottom: true, cells }]),
  });
  const created = result.result[0];
  if (!created) {
    throw new Error("Smartsheet não retornou a linha criada.");
  }
  return created;
}

export async function updateRow(rowId: string, cells: SmartsheetCell[]): Promise<SmartsheetRow> {
  const { sheetId } = getConfig();
  const result = await smartsheetRequest<{ result: SmartsheetRow[] }>(`/sheets/${sheetId}/rows`, {
    method: "PUT",
    body: JSON.stringify([{ id: Number(rowId), cells }]),
  });
  const updated = result.result[0];
  if (!updated) {
    throw new Error("Smartsheet não retornou a linha atualizada.");
  }
  return updated;
}

export interface SmartsheetWebhookRegistration {
  id: number;
  sharedSecret: string;
}

/** Registra (ou reaproveita) o webhook de mudanças do sheet configurado. Deve ser chamado uma vez na configuração inicial. */
export async function registerWebhook(callbackUrl: string): Promise<SmartsheetWebhookRegistration> {
  const { sheetId } = getConfig();
  const created = await smartsheetRequest<{ result: SmartsheetWebhookRegistration }>("/webhooks", {
    method: "POST",
    body: JSON.stringify({
      name: "Netfive Customer Success Sync",
      callbackUrl,
      scope: "sheet",
      scopeObjectId: Number(sheetId),
      events: ["*.*"],
      version: 1,
    }),
  });

  await smartsheetRequest(`/webhooks/${created.result.id}`, {
    method: "PUT",
    body: JSON.stringify({ enabled: true }),
  });

  return created.result;
}

/** Verifica a assinatura HMAC-SHA256 enviada pela Smartsheet em cada callback de webhook. */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.SMARTSHEET_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
