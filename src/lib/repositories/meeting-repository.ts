import type { Meeting } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MeetingDTO, MeetingParticipantDTO } from "@/lib/types";

// Teto de segurança — não deixa o payload crescer sem limite conforme o
// histórico de reuniões acumula. Ordenado por mais recente primeiro.
const MAX_MEETINGS = 300;

function mapMeetingToDTO(meeting: Meeting): MeetingDTO {
  return {
    id: meeting.id,
    title: meeting.title,
    startTime: meeting.startTime.toISOString(),
    endTime: meeting.endTime ? meeting.endTime.toISOString() : null,
    platform: meeting.platform,
    reportUrl: meeting.reportUrl,
    summary: meeting.summary,
    actionItems: meeting.actionItems,
    topics: meeting.topics,
    participants: (meeting.participants as unknown as MeetingParticipantDTO[] | null) ?? [],
    readScore: meeting.readScore,
    sentiment: meeting.sentiment,
    engagement: meeting.engagement,
  };
}

export async function findAllMeetings(): Promise<MeetingDTO[]> {
  const meetings = await prisma.meeting.findMany({
    orderBy: { startTime: "desc" },
    take: MAX_MEETINGS,
  });
  return meetings.map(mapMeetingToDTO);
}
