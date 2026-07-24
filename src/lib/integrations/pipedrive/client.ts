export interface PipedriveOrganizationField {
  key: string;
  name: string;
}

export interface PipedriveOrganization {
  id: number;
  name: string;
  update_time: string;
  [customFieldKey: string]: unknown;
}

export interface PipedriveDeal {
  id: number;
  title: string;
  status: "open" | "won" | "lost" | "deleted";
  value: number;
  currency: string;
  add_time: string;
  close_time: string | null;
}

export interface PipedriveOrgSearchResult {
  id: number;
  name: string;
}

function getConfig() {
  const token = process.env.PIPEDRIVE_API_TOKEN;
  const domain = process.env.PIPEDRIVE_DOMAIN;
  if (!token || !domain) {
    throw new Error("PIPEDRIVE_API_TOKEN ou PIPEDRIVE_DOMAIN não configurados.");
  }
  return { token, domain };
}

async function pipedriveRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { token, domain } = getConfig();
  const separator = path.includes("?") ? "&" : "?";
  const url = `https://${domain}.pipedrive.com/api/v1${path}${separator}api_token=${token}`;

  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = (await response.json().catch(() => null)) as { success?: boolean; data?: T } | null;

  if (!response.ok || !body?.success) {
    throw new Error(`Pipedrive API ${response.status}: ${JSON.stringify(body).slice(0, 500)}`);
  }

  return body.data as T;
}

let fieldsCache: { fields: PipedriveOrganizationField[]; fetchedAt: number } | null = null;
const FIELDS_CACHE_TTL_MS = 5 * 60 * 1000;

/** Campos customizados de Organização configurados na conta Pipedrive, com cache curto. */
export async function getOrganizationFields(): Promise<PipedriveOrganizationField[]> {
  if (fieldsCache && Date.now() - fieldsCache.fetchedAt < FIELDS_CACHE_TTL_MS) {
    return fieldsCache.fields;
  }

  const fields = await pipedriveRequest<PipedriveOrganizationField[]>("/organizationFields");
  fieldsCache = { fields, fetchedAt: Date.now() };
  return fields;
}

/** Negócios (deals) associados a uma organização, mais recentes primeiro. */
export async function listOrganizationDeals(organizationId: string): Promise<PipedriveDeal[]> {
  const deals = await pipedriveRequest<PipedriveDeal[] | null>(
    `/organizations/${organizationId}/deals?status=all_not_deleted`,
  );
  return (deals ?? []).sort((a, b) => new Date(b.add_time).getTime() - new Date(a.add_time).getTime());
}

/** Busca organizações por nome — usada para localizar uma organização já existente antes de criar uma nova. */
export async function searchOrganizationsByName(term: string): Promise<PipedriveOrgSearchResult[]> {
  const result = await pipedriveRequest<{ items: { item: PipedriveOrgSearchResult }[] } | null>(
    `/organizations/search?term=${encodeURIComponent(term)}`,
  );
  return (result?.items ?? []).map((i) => i.item);
}

/** Verifica a autenticação Basic enviada pelo Pipedrive em cada chamada de webhook. */
export function verifyWebhookBasicAuth(authorizationHeader: string | null): boolean {
  const secret = process.env.PIPEDRIVE_WEBHOOK_SECRET;
  if (!secret || !authorizationHeader?.startsWith("Basic ")) return false;

  const expected = Buffer.from(`netfive:${secret}`).toString("base64");
  const received = authorizationHeader.slice("Basic ".length);
  return expected === received;
}
