import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { qbrFiltersSchema } from "@/lib/validations/qbr";
import { findAllQbrActivities } from "@/lib/repositories/qbr-repository";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireSessionEmail();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = qbrFiltersSchema.parse(searchParams);
    const activities = await findAllQbrActivities(filters);

    return NextResponse.json({ data: activities });
  } catch (error) {
    return toErrorResponse(error);
  }
}
