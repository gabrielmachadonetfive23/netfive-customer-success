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

        // Só mostra a falha se ela for mais recente que o último sucesso — senão
        // um erro antigo já superado por uma sincronização bem-sucedida depois
        // ficaria exibido como problema atual pra sempre.
        const isUnresolved = lastError && (!lastLog || lastError.createdAt > lastLog.createdAt);

        return {
          provider,
          configured,
          linkedCustomers: linkedCount,
          lastSuccessAt: lastLog?.createdAt.toISOString() ?? null,
          lastError: isUnresolved ? { message: lastError.message, at: lastError.createdAt.toISOString() } : null,
        };
      }),
    );

    return NextResponse.json({ data: status });
  } catch (error) {
    return toErrorResponse(error);
  }
}
