import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { listAllMeetingsSince, type ReadAiMeeting } from "@/lib/integrations/readai/client";

const CONCURRENCY = 5;
// Primeira sincronização (nenhuma reunião salva ainda): busca só os últimos 30
// dias, para não puxar todo o histórico da conta de uma vez.
const DEFAULT_BACKFILL_DAYS = 30;
// Sincronizações seguintes: revisita uma janela de 24h pra trás da última
// reunião conhecida — cobre o caso de uma reunião que ainda estava em
// andamento (sem resumo/transcript prontos) na sincronização anterior.
const INCREMENTAL_LOOKBACK_MS = 24 * 60 * 60 * 1000;

async function processInBatches<T>(items: T[], size: number, handler: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(handler));
  }
}

function toMeetingData(meeting: ReadAiMeeting) {
  return {
    title: meeting.title,
    startTime: new Date(meeting.start_time_ms),
    endTime: meeting.end_time_ms ? new Date(meeting.end_time_ms) : null,
    platform: meeting.platform,
    reportUrl: meeting.report_url,
    ownerEmail: meeting.owner?.email ?? null,
    ownerName: meeting.owner?.name ?? null,
    summary: meeting.summary ?? null,
    actionItems: (meeting.action_items ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    topics: (meeting.topics ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    participants: meeting.participants as unknown as Prisma.InputJsonValue,
    readScore: meeting.metrics?.read_score ?? null,
    sentiment: meeting.metrics?.sentiment ?? null,
    engagement: meeting.metrics?.engagement ?? null,
    lastSyncedAt: new Date(),
  };
}

export interface MeetingSyncSummary {
  fetched: number;
  upserted: number;
  errors: number;
}

export async function syncMeetings(): Promise<MeetingSyncSummary> {
  const latest = await prisma.meeting.findFirst({ orderBy: { startTime: "desc" }, select: { startTime: true } });
  const startTimeMsGte = latest
    ? latest.startTime.getTime() - INCREMENTAL_LOOKBACK_MS
    : Date.now() - DEFAULT_BACKFILL_DAYS * 24 * 60 * 60 * 1000;

  const meetings = await listAllMeetingsSince(startTimeMsGte);
  const summary: MeetingSyncSummary = { fetched: meetings.length, upserted: 0, errors: 0 };

  await processInBatches(meetings, CONCURRENCY, async (meeting) => {
    try {
      const data = toMeetingData(meeting);
      await prisma.meeting.upsert({
        where: { readAiId: meeting.id },
        update: data,
        create: { readAiId: meeting.id, ...data },
      });
      summary.upserted++;
    } catch {
      summary.errors++;
    }
  });

  return summary;
}
