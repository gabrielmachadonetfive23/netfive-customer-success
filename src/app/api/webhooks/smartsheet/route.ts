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

// Edições em lote (ex.: colar uma coluna inteira) chegam num único callback com
// dezenas de eventos de linha — processá-los em paralelo evita estourar o tempo
// limite da função serverless (o processamento sequencial de N linhas escala
// linearmente e pode ultrapassar o limite antes de terminar).
export const maxDuration = 60;

// Processar TODAS as linhas de um lote grande ao mesmo tempo pode esgotar o
// limite de conexões do pooler do Postgres (cada linha faz várias idas ao
// banco). Um lote de 5 por vez equilibra velocidade com o limite de conexões.
const CONCURRENCY = 5;

async function processInBatches<T>(items: T[], size: number, handler: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(handler));
  }
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
  const rowEvents = (payload.events ?? []).filter(
    (event) => event.objectType === "row" && (event.eventType === "created" || event.eventType === "updated"),
  );
  // Uma mesma linha pode aparecer mais de uma vez no lote (uma edição por
  // célula alterada) — como sempre buscamos a linha inteira via getRow, só
  // precisamos processar cada linha uma vez.
  const uniqueRowIds = Array.from(new Set(rowEvents.map((event) => String(event.id))));

  await processInBatches(uniqueRowIds, CONCURRENCY, async (rowId) => {
    try {
      const row = await getRow(rowId);
      const values = await smartsheetRowToFieldValues(row);
      await applyIncomingChange({
        provider: "smartsheet",
        externalId: String(row.id),
        externalUpdatedAt: new Date(row.modifiedAt),
        values,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error("[webhook:smartsheet] falha ao processar evento de linha:", rowId, message);
      await prisma.syncLog
        .create({
          data: { provider: "smartsheet", direction: "pull", status: "error", message: `Linha ${rowId}: ${message}` },
        })
        .catch(() => {});
    }
  });

  return NextResponse.json({ received: true });
}
