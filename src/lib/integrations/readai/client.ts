import { getValidAccessToken } from "@/lib/integrations/readai/oauth";

const API_BASE = "https://api.read.ai";

export interface ReadAiParticipant {
  name: string;
  email: string;
  invited: boolean;
  attended: boolean;
}

export interface ReadAiMeeting {
  id: string;
  start_time_ms: number;
  end_time_ms: number | null;
  title: string;
  participants: ReadAiParticipant[];
  owner: { name: string; email: string } | null;
  report_url: string | null;
  platform: string | null;
  live_enabled: boolean;
  // Campos abaixo só vêm preenchidos quando pedidos via expand[].
  summary?: string;
  action_items?: unknown;
  topics?: unknown;
  metrics?: { read_score?: number; sentiment?: number; engagement?: number };
}

interface ListMeetingsResponse {
  object: string;
  has_more: boolean;
  data: ReadAiMeeting[];
}

const DEFAULT_EXPAND = ["summary", "action_items", "topics", "metrics"];

async function readAiRequest<T>(path: string): Promise<T> {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Read.ai API ${response.status}: ${text.slice(0, 300)}`);
  }

  return (await response.json()) as T;
}

function buildExpandQuery(expand: readonly string[]): string {
  return expand.map((field) => `expand[]=${encodeURIComponent(field)}`).join("&");
}

/**
 * Lista reuniões em ordem cronológica reversa, seguindo o cursor até o fim
 * (ou até `maxPages` páginas — proteção contra loop caso `has_more` nunca
 * feche). O limite de itens por página é fixo em 10 pela própria API.
 */
export async function listAllMeetingsSince(startTimeMsGte: number, maxPages = 20): Promise<ReadAiMeeting[]> {
  const meetings: ReadAiMeeting[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ limit: "10", "start_time_ms.gte": String(startTimeMsGte) });
    if (cursor) params.set("cursor", cursor);

    const query = `${params.toString()}&${buildExpandQuery(DEFAULT_EXPAND)}`;
    const response = await readAiRequest<ListMeetingsResponse>(`/v1/meetings?${query}`);
    meetings.push(...response.data);

    if (!response.has_more || response.data.length === 0) break;
    cursor = response.data[response.data.length - 1]?.id;
  }

  return meetings;
}
