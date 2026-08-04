import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin-check";
import { npsResponseInputSchema } from "@/lib/validations/nps";
import { deleteNpsResponse, updateNpsResponse } from "@/lib/repositories/nps-repository";
import { toErrorResponse } from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    await requireSessionEmail();
    assertSameOrigin(request);

    const input = npsResponseInputSchema.parse(await request.json());
    const response = await updateNpsResponse(params.id, input);

    return NextResponse.json({ data: response });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    await requireSessionEmail();
    assertSameOrigin(request);

    await deleteNpsResponse(params.id);

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
