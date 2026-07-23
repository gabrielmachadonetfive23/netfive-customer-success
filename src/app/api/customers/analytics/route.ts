import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSessionEmail } from "@/lib/auth/session";
import { customerFiltersSchema } from "@/lib/validations/filters";
import { findAllCustomersForAnalytics } from "@/lib/repositories/customer-repository";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/** Retorna a lista completa (sem paginação) de clientes que casam com os filtros, para cálculo de KPIs e gráficos. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireSessionEmail();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = customerFiltersSchema.parse(searchParams);
    const customers = await findAllCustomersForAnalytics(filters);

    return NextResponse.json({ data: customers });
  } catch (error) {
    return toErrorResponse(error);
  }
}
