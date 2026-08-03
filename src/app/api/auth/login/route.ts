import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/db";
import { verifyDummyPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session-service";
import { setSessionCookie } from "@/lib/auth/session";
import { RateLimitError, UnauthorizedError, toErrorResponse } from "@/lib/api/errors";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = loginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new RateLimitError("Muitas tentativas incorretas. Tente novamente em alguns minutos.");
    }

    const isValid = user ? verifyPassword(password, user.passwordHash, user.passwordSalt) : verifyDummyPassword(password);

    if (!user || !isValid) {
      if (user) {
        const attempts = user.failedLoginAttempts + 1;
        await prisma.user.update({
          where: { email },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
          },
        });
      }
      // Mensagem genérica: não confirmamos se o e-mail existe ou não na base.
      throw new UnauthorizedError("E-mail ou senha inválidos.");
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({ where: { email }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    const session = await createSession(email);
    const response = NextResponse.json({ data: { email, mustChangePassword: user.mustChangePassword } });
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
