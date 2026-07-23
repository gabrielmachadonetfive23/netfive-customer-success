import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin-check";
import { observationInputSchema } from "@/lib/validations/observation";
import * as customerService from "@/lib/services/customer-service";
import { toErrorResponse } from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const email = await requireSessionEmail();
    assertSameOrigin(request);

    const input = observationInputSchema.parse(await request.json());
    const observation = await customerService.addObservation(params.id, input, email);

    return NextResponse.json({ data: observation }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
