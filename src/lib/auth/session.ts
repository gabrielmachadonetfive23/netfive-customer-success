import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/constants";
import { resolveSession } from "@/lib/auth/session-service";
import { UnauthorizedError } from "@/lib/api/errors";

/** Lê o e-mail da sessão atual a partir do cookie HttpOnly, validando no banco. Retorna null se ausente/expirada. */
export async function getCurrentSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return resolveSession(token);
}

/** Igual a getCurrentSessionEmail, mas lança 401 caso não haja sessão válida. Uso em rotas de API. */
export async function requireSessionEmail(): Promise<string> {
  const email = await getCurrentSessionEmail();
  if (!email) {
    throw new UnauthorizedError();
  }
  return email;
}

// Secure=true sempre: navegadores modernos tratam http://localhost como contexto
// seguro, então cookies Secure funcionam normalmente em desenvolvimento local.
// Em qualquer outro host, HTTPS é obrigatório.
export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function getRawSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export const SESSION_MAX_AGE_MS = SESSION_DURATION_MS;
