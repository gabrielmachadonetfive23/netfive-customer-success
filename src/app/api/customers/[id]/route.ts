import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin-check";
import { customerInputSchema } from "@/lib/validations/customer";
import { findCustomerDetailById } from "@/lib/repositories/customer-repository";
import * as customerService from "@/lib/services/customer-service";
import { toErrorResponse } from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    await requireSessionEmail();
    const customer = await findCustomerDetailById(params.id);
    return NextResponse.json({ data: customer });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const email = await requireSessionEmail();
    assertSameOrigin(request);

    const input = customerInputSchema.parse(await request.json());
    const customer = await customerService.updateCustomer(params.id, input, email);

    return NextResponse.json({ data: customer });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const email = await requireSessionEmail();
    assertSameOrigin(request);

    await customerService.deleteCustomer(params.id, email);

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
