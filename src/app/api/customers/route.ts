import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin-check";
import { customerInputSchema, customerListQuerySchema } from "@/lib/validations/customer";
import { findCustomersPaginated } from "@/lib/repositories/customer-repository";
import * as customerService from "@/lib/services/customer-service";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireSessionEmail();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = customerListQuerySchema.parse(searchParams);
    const result = await findCustomersPaginated(query);

    return NextResponse.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const email = await requireSessionEmail();
    assertSameOrigin(request);

    const input = customerInputSchema.parse(await request.json());
    const customer = await customerService.createCustomer(input, email);

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
