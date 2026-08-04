import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin-check";
import { npsResponseInputSchema } from "@/lib/validations/nps";
import { createNpsResponse, findAllNpsResponses } from "@/lib/repositories/nps-repository";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSessionEmail();
    const responses = await findAllNpsResponses();
    return NextResponse.json({ data: responses });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireSessionEmail();
    assertSameOrigin(request);

    const input = npsResponseInputSchema.parse(await request.json());
    const response = await createNpsResponse(input);

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
