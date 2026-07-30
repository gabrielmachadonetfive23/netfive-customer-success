import { prisma } from "@/lib/db";
import { queryQbrActivities } from "@/lib/integrations/notion/client";

const CONCURRENCY = 5;

async function processInBatches<T>(items: T[], size: number, handler: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(handler));
  }
}

export interface QbrSyncSummary {
  fetched: number;
  upserted: number;
  removed: number;
  errors: number;
}

/**
 * Sincroniza as atividades abertas de QBR/SBR do Notion — chamada pelo cron
 * periódico (ver /api/cron/qbr). A base do Notion já representa apenas
 * atividades abertas, então uma atividade encerrada simplesmente some do
 * resultado da consulta; para refletir isso, qualquer registro local cujo
 * notionPageId não aparecer mais na busca atual é removido.
 */
export async function syncQbrActivities(): Promise<QbrSyncSummary> {
  const rows = await queryQbrActivities();
  const summary: QbrSyncSummary = { fetched: rows.length, upserted: 0, removed: 0, errors: 0 };

  await processInBatches(rows, CONCURRENCY, async (row) => {
    try {
      const data = {
        notionUrl: row.notionUrl,
        activity: row.activity,
        cliente: row.cliente,
        team: row.team,
        responsavel: row.responsavel,
        status: row.status,
        tipo: row.tipo,
        quarter: row.quarter,
        overdue: row.overdue,
        agidesk: row.agidesk,
        dueDate: row.dueDate ? new Date(row.dueDate) : null,
        lastSyncedAt: new Date(),
      };

      await prisma.qbrActivity.upsert({
        where: { notionPageId: row.notionPageId },
        update: data,
        create: { notionPageId: row.notionPageId, ...data },
      });
      summary.upserted++;
    } catch {
      summary.errors++;
    }
  });

  const seenIds = rows.map((row) => row.notionPageId);
  const deleted = await prisma.qbrActivity.deleteMany({
    where: seenIds.length > 0 ? { notionPageId: { notIn: seenIds } } : {},
  });
  summary.removed = deleted.count;

  return summary;
}
