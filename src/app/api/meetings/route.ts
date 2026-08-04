import { NextResponse } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { findAllMeetings } from "@/lib/repositories/meeting-repository";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSessionEmail();
    const meetings = await findAllMeetings();
    return NextResponse.json({ data: meetings });
  } catch (error) {
    return toErrorResponse(error);
  }
}
