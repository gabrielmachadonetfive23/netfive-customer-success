import { NextResponse } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { listServices } from "@/lib/repositories/service-repository";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSessionEmail();
    const services = await listServices();
    return NextResponse.json({ data: services });
  } catch (error) {
    return toErrorResponse(error);
  }
}
