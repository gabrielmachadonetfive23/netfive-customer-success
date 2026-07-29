import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchAndStoreNews } from "@/lib/services/news-service";

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Coleta diária de notícias (08h, via GitHub Actions — ver
 * .github/workflows/news-cron.yml, mesmo motivo do /api/cron/sync: o plano
 * Hobby da Vercel só permite Cron Jobs nativos 1x/dia e sem horário fixo
 * confiável).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Token inválido." } }, { status: 401 });
  }

  const summary = await fetchAndStoreNews();
  return NextResponse.json({ data: summary });
}
