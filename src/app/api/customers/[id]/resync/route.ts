import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/api/origin-check";
import * as customerService from "@/lib/services/customer-service";
import { toErrorResponse } from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

/** Fallback manual: reenvia o cliente para Smartsheet/Pipedrive caso a sincronização automática tenha falhado. */
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    await requireSessionEmail();
    assertSameOrigin(request);

    const customer = await customerService.resyncCustomer(params.id);
    return NextResponse.json({ data: customer });
  } catch (error) {
    return toErrorResponse(error);
  }
}
