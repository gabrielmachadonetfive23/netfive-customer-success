import type { Meeting } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MeetingDTO, MeetingParticipantDTO } from "@/lib/types";

// Teto de segurança — não deixa o payload crescer sem limite conforme o
// histórico de reuniões acumula. Ordenado por mais recente primeiro.
const MAX_MEETINGS = 300;
// Busca uma folga maior que MAX_MEETINGS antes de filtrar por visibilidade,
// senão um corte prematuro poderia excluir reuniões visíveis que estariam
// mais adiante na lista completa (já que a maioria pertence a outros CS).
const FETCH_POOL_SIZE = 1000;

function mapMeetingToDTO(meeting: Meeting): MeetingDTO {
  return {
    id: meeting.id,
    title: meeting.title,
    startTime: meeting.startTime.toISOString(),
    endTime: meeting.endTime ? meeting.endTime.toISOString() : null,
    platform: meeting.platform,
    reportUrl: meeting.reportUrl,
    ownerName: meeting.ownerName,
    summary: meeting.summary,
    actionItems: meeting.actionItems,
    topics: meeting.topics,
    participants: (meeting.participants as unknown as MeetingParticipantDTO[] | null) ?? [],
    readScore: meeting.readScore,
    sentiment: meeting.sentiment,
    engagement: meeting.engagement,
  };
}

function isVisibleToViewer(meeting: Meeting, viewerEmail: string): boolean {
  const email = viewerEmail.toLowerCase();
  if (meeting.ownerEmail && meeting.ownerEmail.toLowerCase() === email) return true;
  const participants = (meeting.participants as unknown as MeetingParticipantDTO[] | null) ?? [];
  return participants.some((p) => p.email?.toLowerCase() === email);
}

export interface MeetingViewer {
  email: string;
  isAdmin: boolean;
}

/**
 * Cada CS só vê reuniões que organizou ou das quais participou — só quem tem
 * `isAdmin` (hoje, só relacionamento@) vê a lista completa.
 */
export async function findAllMeetings(viewer: MeetingViewer): Promise<MeetingDTO[]> {
  const meetings = await prisma.meeting.findMany({
    orderBy: { startTime: "desc" },
    take: FETCH_POOL_SIZE,
  });

  const visible = viewer.isAdmin ? meetings : meetings.filter((meeting) => isVisibleToViewer(meeting, viewer.email));

  return visible.slice(0, MAX_MEETINGS).map(mapMeetingToDTO);
}
