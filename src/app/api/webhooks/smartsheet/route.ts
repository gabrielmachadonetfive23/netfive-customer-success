import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRow, verifyWebhookSignature } from "@/lib/integrations/smartsheet/client";
import { smartsheetRowToFieldValues } from "@/lib/integrations/smartsheet/mapper";
import { applyIncomingChange } from "@/lib/integrations/sync-orchestrator";
import { prisma } from "@/lib/db";

interface SmartsheetWebhookEvent {
  objectType: string;
  eventType: string;
  id: number;
}

interface SmartsheetWebhookPayload {
  webhookId: number;
  events?: SmartsheetWebhookEvent[];
}

/**
 * Callback de eventos do Smartsheet. No cadastro do webhook, a Smartsheet envia
 * uma requisição de verificação com o header "Smartsheet-Hook-Challenge", que
 * deve ser ecoado de volta. Chamadas subsequentes trazem apenas notificações
 * (sem os dados completos da linha) — por isso buscamos a linha via API antes
 * de aplicar a mudança.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const challenge = request.headers.get("smartsheet-hook-challenge");
  if (challenge) {
    return NextResponse.json({ smartsheetHookResponse: challenge });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("smartsheet-hook-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Assinatura inválida." } }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as SmartsheetWebhookPayload;
  await prisma.syncLog
    .create({
      data: {
        provider: "smartsheet",
        direction: "pull",
        status: "skipped",
        message: `DEBUG payload: ${JSON.stringify(payload).slice(0, 3000)}`,
      },
    })
    .catch(() => {});
  const rowEvents = (payload.events ?? []).filter(
    (event) => event.objectType === "row" && (event.eventType === "created" || event.eventType === "updated"),
  );

  for (const event of rowEvents) {
    try {
      const row = await getRow(String(event.id));
      const values = await smartsheetRowToFieldValues(row);
      await applyIncomingChange({
        provider: "smartsheet",
        externalId: String(row.id),
        externalUpdatedAt: new Date(row.modifiedAt),
        values,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[webhook:smartsheet] falha ao processar evento de linha:", error);
    }
  }

  return NextResponse.json({ received: true });
}
