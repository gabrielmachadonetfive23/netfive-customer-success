import type { NextRequest } from "next/server";
import { UnauthorizedError } from "@/lib/api/errors";

/**
 * Defesa em profundidade contra CSRF em rotas que alteram estado. O cookie de
 * sessão já usa SameSite=Strict (o navegador não o envia em requisições
 * cross-site), mas validamos também a origem da requisição como segunda camada.
 */
export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) return; // requisições same-origin via fetch same-site nem sempre enviam Origin; o cookie SameSite já protege

  const host = request.headers.get("host");
  const originHost = new URL(origin).host;

  if (host && originHost !== host) {
    throw new UnauthorizedError("Origem da requisição não confiável.");
  }
}
