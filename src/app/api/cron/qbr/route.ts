import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { syncQbrActivities } from "@/lib/services/qbr-service";

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Sincronização periódica das atividades de QBR/SBR do Notion — mesmo agendador do /api/cron/sync (GitHub Actions, a cada 30min). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Token inválido." } }, { status: 401 });
  }

  if (!process.env.NOTION_API_TOKEN || !process.env.NOTION_QBR_DATA_SOURCE_ID) {
    return NextResponse.json({ data: { skipped: true, reason: "Integração com Notion não configurada." } });
  }

  const summary = await syncQbrActivities();
  return NextResponse.json({ data: summary });
}
