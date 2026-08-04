import { NextResponse } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { findAllMeetings } from "@/lib/repositories/meeting-repository";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const email = await requireSessionEmail();
    const user = await prisma.user.findUnique({ where: { email }, select: { isAdmin: true } });

    const meetings = await findAllMeetings({ email, isAdmin: user?.isAdmin ?? false });
    return NextResponse.json({ data: meetings });
  } catch (error) {
    return toErrorResponse(error);
  }
}
