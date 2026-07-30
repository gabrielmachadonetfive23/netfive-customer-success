const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";

export interface NotionQbrRow {
  notionPageId: string;
  notionUrl: string;
  activity: string;
  cliente: string | null;
  team: string | null;
  responsavel: string | null;
  status: string | null;
  tipo: string | null;
  quarter: string | null;
  overdue: boolean;
  agidesk: string | null;
  dueDate: string | null; // ISO date
}

function getConfig() {
  const token = process.env.NOTION_API_TOKEN;
  const dataSourceId = process.env.NOTION_QBR_DATA_SOURCE_ID;
  if (!token || !dataSourceId) {
    throw new Error("NOTION_API_TOKEN ou NOTION_QBR_DATA_SOURCE_ID não configurados.");
  }
  return { token, dataSourceId };
}

interface NotionRichText {
  plain_text: string;
}

interface NotionProperty {
  type: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  select?: { name: string } | null;
  date?: { start: string; end: string | null } | null;
}

interface NotionPage {
  id: string;
  url: string;
  properties: Record<string, NotionProperty>;
}

function titleText(prop: NotionProperty | undefined): string {
  return (prop?.title ?? []).map((t) => t.plain_text).join("");
}

function richText(prop: NotionProperty | undefined): string | null {
  const text = (prop?.rich_text ?? []).map((t) => t.plain_text).join("");
  return text || null;
}

function selectName(prop: NotionProperty | undefined): string | null {
  return prop?.select?.name ?? null;
}

function mapPage(page: NotionPage): NotionQbrRow {
  const props = page.properties;
  return {
    notionPageId: page.id,
    notionUrl: page.url,
    activity: titleText(props.Atividade) || "(sem título)",
    cliente: selectName(props.Cliente),
    team: selectName(props.Time),
    responsavel: selectName(props["Responsável"]),
    status: selectName(props.Status),
    tipo: selectName(props.Tipo),
    quarter: selectName(props.Quarter),
    overdue: selectName(props.Atrasada) === "Sim",
    agidesk: richText(props.Agidesk),
    dueDate: props.Vencimento?.date?.start ?? null,
  };
}

/** Busca todas as atividades da base "QBR/SBR - Atividades Abertas" no Notion, paginando até o fim. */
export async function queryQbrActivities(): Promise<NotionQbrRow[]> {
  const { token, dataSourceId } = getConfig();
  const rows: NotionQbrRow[] = [];
  let cursor: string | undefined;

  do {
    const response = await fetch(`${NOTION_API_BASE}/data_sources/${dataSourceId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Notion API ${response.status}: ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as { results: NotionPage[]; has_more: boolean; next_cursor: string | null };
    rows.push(...data.results.map(mapPage));
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return rows;
}
