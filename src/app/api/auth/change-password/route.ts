import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin-check";
import { changePasswordSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { UnauthorizedError, toErrorResponse } from "@/lib/api/errors";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const email = await requireSessionEmail();
    assertSameOrigin(request);

    const { currentPassword, newPassword } = changePasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(currentPassword, user.passwordHash, user.passwordSalt)) {
      throw new UnauthorizedError("Senha atual incorreta.");
    }

    const { hash, salt } = hashPassword(newPassword);
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hash, passwordSalt: salt, mustChangePassword: false },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
