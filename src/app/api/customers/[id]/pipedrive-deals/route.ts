import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSessionEmail } from "@/lib/auth/session";
import { listOrganizationDeals } from "@/lib/integrations/pipedrive/client";
import { toErrorResponse } from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

/** Negócios do Pipedrive associados ao cliente, quando já vinculado a uma organização. */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    await requireSessionEmail();

    const link = await prisma.externalLink.findUnique({
      where: { customerId_provider: { customerId: params.id, provider: "pipedrive" } },
    });

    if (!link) {
      return NextResponse.json({ data: { linked: false, deals: [] } });
    }

    const deals = await listOrganizationDeals(link.externalId);
    return NextResponse.json({ data: { linked: true, deals } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
