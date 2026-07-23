import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSessionEmail } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await requireSessionEmail();

    const providers = ["smartsheet", "pipedrive"] as const;
    const status = await Promise.all(
      providers.map(async (provider) => {
        const configured =
          provider === "smartsheet"
            ? Boolean(process.env.SMARTSHEET_API_TOKEN && process.env.SMARTSHEET_SHEET_ID)
            : Boolean(process.env.PIPEDRIVE_API_TOKEN && process.env.PIPEDRIVE_DOMAIN);

        const [linkedCount, lastLog, lastError] = await Promise.all([
          prisma.externalLink.count({ where: { provider } }),
          prisma.syncLog.findFirst({ where: { provider, status: "success" }, orderBy: { createdAt: "desc" } }),
          prisma.syncLog.findFirst({ where: { provider, status: "error" }, orderBy: { createdAt: "desc" } }),
        ]);

        return {
          provider,
          configured,
          linkedCustomers: linkedCount,
          lastSuccessAt: lastLog?.createdAt.toISOString() ?? null,
          lastError: lastError
            ? { message: lastError.message, at: lastError.createdAt.toISOString() }
            : null,
        };
      }),
    );

    return NextResponse.json({ data: status });
  } catch (error) {
    return toErrorResponse(error);
  }
}
