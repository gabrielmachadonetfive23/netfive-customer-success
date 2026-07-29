import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { newsListQuerySchema } from "@/lib/validations/news";
import { findNewsPaginated } from "@/lib/repositories/news-repository";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireSessionEmail();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = newsListQuerySchema.parse(searchParams);
    const result = await findNewsPaginated(query);

    return NextResponse.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
