import { NextResponse } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { findQbrFilterOptions } from "@/lib/repositories/qbr-repository";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSessionEmail();
    const options = await findQbrFilterOptions();
    return NextResponse.json({ data: options });
  } catch (error) {
    return toErrorResponse(error);
  }
}
