import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { listSheetRows } from "@/lib/integrations/smartsheet/client";
import { smartsheetRowToFieldValues } from "@/lib/integrations/smartsheet/mapper";
import {
  applyIncomingChange,
  pushCustomerToAllProviders,
  tryLinkPipedriveOrganization,
} from "@/lib/integrations/sync-orchestrator";
import { findCustomerDetailById } from "@/lib/repositories/customer-repository";

export const maxDuration = 60;

// Protege o pooler de conexões do Postgres contra um pico de requisições
// simultâneas — mesmo limite usado no webhook do Smartsheet.
const CONCURRENCY = 5;

async function processInBatches<T>(items: T[], size: number, handler: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(handler));
  }
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Reconciliação periódica de segurança — chamada por um agendador externo
 * (GitHub Actions, a cada 30min) porque o plano Hobby da Vercel só permite
 * Cron Jobs nativos uma vez por dia. Cobre o que a sincronização em tempo
 * real (webhook do Smartsheet + push a cada edição) pode ter perdido, sem
 * reprocessar tudo a cada execução:
 * 1. Compara o `modifiedAt` de cada linha da planilha com o timestamp do
 *    último sync conhecido — só linhas realmente alteradas desde então
 *    (ou linhas novas, sem vínculo) são processadas.
 * 2. Reenvia clientes cuja última edição local é mais recente que o
 *    último sync com sucesso (cobre um push que tenha falhado sem
 *    retentativa).
 * 3. Tenta vincular ao Pipedrive quem ainda não tem organização vinculada.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Token inválido." } }, { status: 401 });
  }

  const summary = {
    smartsheetRowsChecked: 0,
    smartsheetPulled: 0,
    smartsheetPullErrors: 0,
    smartsheetRetriedPush: 0,
    smartsheetRetriedPushErrors: 0,
    pipedriveLinked: 0,
    sheetFetchError: null as string | null,
  };

  try {
    const [rows, links] = await Promise.all([
      listSheetRows(),
      prisma.externalLink.findMany({ where: { provider: "smartsheet" } }),
    ]);
    summary.smartsheetRowsChecked = rows.length;

    const linkByExternalId = new Map(links.map((link) => [link.externalId, link]));
    const changedRows = rows.filter((row) => {
      const link = linkByExternalId.get(String(row.id));
      if (!link || !link.externalUpdatedAt) return true; // linha nova ou nunca sincronizada
      return new Date(row.modifiedAt).getTime() > link.externalUpdatedAt.getTime();
    });

    await processInBatches(changedRows, CONCURRENCY, async (row) => {
      try {
        const values = await smartsheetRowToFieldValues(row);
        await applyIncomingChange({
          provider: "smartsheet",
          externalId: String(row.id),
          externalUpdatedAt: new Date(row.modifiedAt),
          values,
        });
        summary.smartsheetPulled++;
      } catch {
        summary.smartsheetPullErrors++;
      }
    });
  } catch (error) {
    summary.sheetFetchError = error instanceof Error ? error.message : String(error);
  }

  const smartsheetLinks = await prisma.externalLink.findMany({
    where: { provider: "smartsheet" },
    select: { customerId: true, lastSyncedAt: true, customer: { select: { updatedAt: true } } },
  });
  const staleCustomerIds = smartsheetLinks
    .filter((link) => link.customer.updatedAt.getTime() > link.lastSyncedAt.getTime())
    .map((link) => ({ customerId: link.customerId }));

  await processInBatches(staleCustomerIds, CONCURRENCY, async ({ customerId }) => {
    try {
      const customer = await findCustomerDetailById(customerId);
      await pushCustomerToAllProviders(customer);
      summary.smartsheetRetriedPush++;
    } catch {
      summary.smartsheetRetriedPushErrors++;
    }
  });

  const unlinked = await prisma.customer.findMany({
    where: { externalLinks: { none: { provider: "pipedrive" } } },
    select: { id: true, companyName: true },
  });
  await processInBatches(unlinked, CONCURRENCY, async (customer) => {
    const before = await prisma.externalLink.count({ where: { customerId: customer.id, provider: "pipedrive" } });
    await tryLinkPipedriveOrganization(customer.id, customer.companyName);
    const after = await prisma.externalLink.count({ where: { customerId: customer.id, provider: "pipedrive" } });
    if (after > before) summary.pipedriveLinked++;
  });

  return NextResponse.json({ data: summary });
}
