import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { isEmailAllowed } from "@/lib/auth/allowed-emails";
import { createSession } from "@/lib/auth/session-service";
import { setSessionCookie } from "@/lib/auth/session";
import { UnauthorizedError, toErrorResponse } from "@/lib/api/errors";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email } = loginSchema.parse(await request.json());

    if (!isEmailAllowed(email)) {
      // Mensagem genérica: não confirmamos se o e-mail existe ou não na lista.
      throw new UnauthorizedError("Este e-mail não tem acesso à plataforma.");
    }

    const session = await createSession(email);
    const response = NextResponse.json({ data: { email } });
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
