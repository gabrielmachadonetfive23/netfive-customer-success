import { createHmac, randomBytes } from "crypto";

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET não configurado ou fraco demais. Defina uma variável de ambiente segura.");
  }
  return secret;
}

/** Gera um token de sessão opaco e aleatório (não reversível). */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Deriva um hash HMAC-SHA256 usando AUTH_SECRET como pepper. Nunca armazenamos o valor em claro. */
export function hashSecret(value: string): string {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}
