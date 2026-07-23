import { prisma } from "@/lib/db";
import { generateSessionToken, hashSecret } from "@/lib/auth/crypto";
import { SESSION_DURATION_MS } from "@/lib/constants";

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

/** Cria uma nova sessão persistida (hash do token) válida por 48 horas. */
export async function createSession(email: string): Promise<CreatedSession> {
  const token = generateSessionToken();
  const tokenHash = hashSecret(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.userSession.create({
    data: { email, tokenHash, expiresAt },
  });

  return { token, expiresAt };
}

/** Retorna o e-mail da sessão se o token for válido e não expirado; caso contrário, null. */
export async function resolveSession(token: string | undefined): Promise<string | null> {
  if (!token) return null;

  const tokenHash = hashSecret(token);
  const session = await prisma.userSession.findUnique({ where: { tokenHash } });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;

  return session.email;
}

/** Invalida a sessão no banco (logout). */
export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const tokenHash = hashSecret(token);
  await prisma.userSession.deleteMany({ where: { tokenHash } });
}

/** Remove sessões expiradas. Pode ser chamado periodicamente (ex.: cron job). */
export async function purgeExpiredSessions(): Promise<void> {
  await prisma.userSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
