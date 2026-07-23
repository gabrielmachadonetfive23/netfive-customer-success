import { NextResponse } from "next/server";
import { getRawSessionToken, clearSessionCookie } from "@/lib/auth/session";
import { destroySession } from "@/lib/auth/session-service";
import { toErrorResponse } from "@/lib/api/errors";

export async function POST(): Promise<NextResponse> {
  try {
    const token = await getRawSessionToken();
    await destroySession(token);

    const response = NextResponse.json({ data: { loggedOut: true } });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
