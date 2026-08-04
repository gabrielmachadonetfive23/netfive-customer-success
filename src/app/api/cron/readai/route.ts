import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { syncMeetings } from "@/lib/services/readai-service";

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Sincronização periódica das reuniões do Read.ai — mesmo agendador do /api/cron/sync (GitHub Actions, a cada 30min). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Token inválido." } }, { status: 401 });
  }

  if (!process.env.READAI_CLIENT_ID || !process.env.READAI_CLIENT_SECRET) {
    return NextResponse.json({ data: { skipped: true, reason: "Integração com Read.ai não configurada." } });
  }

  try {
    const summary = await syncMeetings();
    return NextResponse.json({ data: summary });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "READAI_SYNC_ERROR", message: error instanceof Error ? error.message : String(error) } },
      { status: 502 },
    );
  }
}
