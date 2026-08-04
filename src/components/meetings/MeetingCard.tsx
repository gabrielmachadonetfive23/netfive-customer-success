"use client";

import { useState } from "react";
import { ChevronUpDownIcon, ExternalLinkIcon } from "@/components/icons";
import { normalizeToTextList } from "@/lib/meeting-format";
import { formatDateTime } from "@/lib/format";
import type { MeetingDTO } from "@/lib/types";

function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "em andamento";
  const minutes = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h${rest}min` : `${hours}h`;
}

/**
 * A documentação do Read.ai mostra essas métricas como fração 0-1, mas a API
 * real retorna direto em escala 0-100 — trata os dois casos pra não depender
 * de qual delas está certa (a API ainda está em beta aberta e pode mudar).
 */
function formatMetric(value: number | null): string | null {
  if (value === null) return null;
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

export function MeetingCard({ meeting }: { meeting: MeetingDTO }) {
  const [expanded, setExpanded] = useState(false);

  const actionItems = normalizeToTextList(meeting.actionItems);
  const topics = normalizeToTextList(meeting.topics);
  const attendedCount = meeting.participants.filter((p) => p.attended).length;

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {meeting.platform && (
              <span className="rounded-full bg-netfive-overlay/[0.06] px-2 py-0.5 text-xs text-netfive-gray-500">
                {meeting.platform}
              </span>
            )}
            <span className="text-xs text-netfive-gray-500">{formatDuration(meeting.startTime, meeting.endTime)}</span>
          </div>
          <h3 className="font-medium text-netfive-gray-100">{meeting.title}</h3>
          <p className="text-xs text-netfive-gray-500">
            {formatDateTime(meeting.startTime)} · {attendedCount} participante{attendedCount !== 1 ? "s" : ""}
          </p>
        </div>
        <ChevronUpDownIcon className={`h-4 w-4 shrink-0 text-netfive-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-netfive-border px-4 py-3">
          {meeting.summary && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-netfive-gray-500">Resumo</p>
              <p className="text-sm text-netfive-gray-300">{meeting.summary}</p>
            </div>
          )}

          {actionItems.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-netfive-gray-500">Itens de ação</p>
              <ul className="list-inside list-disc space-y-0.5 text-sm text-netfive-gray-300">
                {actionItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {topics.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-netfive-gray-500">Tópicos</p>
              <div className="flex flex-wrap gap-1.5">
                {topics.map((topic, index) => (
                  <span key={index} className="rounded-full bg-netfive-overlay/[0.06] px-2 py-0.5 text-xs text-netfive-gray-300">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {meeting.participants.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-netfive-gray-500">Participantes</p>
              <ul className="space-y-0.5 text-sm text-netfive-gray-300">
                {meeting.participants.map((participant) => (
                  <li key={participant.email || participant.name}>
                    {participant.name}
                    {participant.email && <span className="text-netfive-gray-500"> · {participant.email}</span>}
                    {!participant.attended && <span className="text-netfive-gray-700"> (não compareceu)</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(meeting.readScore !== null || meeting.sentiment !== null || meeting.engagement !== null) && (
            <div className="flex gap-4 text-xs text-netfive-gray-500">
              {formatMetric(meeting.readScore) && <span>Read Score: {formatMetric(meeting.readScore)}</span>}
              {formatMetric(meeting.sentiment) && <span>Sentimento: {formatMetric(meeting.sentiment)}</span>}
              {formatMetric(meeting.engagement) && <span>Engajamento: {formatMetric(meeting.engagement)}</span>}
            </div>
          )}

          {meeting.reportUrl && (
            <a
              href={meeting.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-netfive-red hover:underline"
            >
              Ver no Read.ai <ExternalLinkIcon className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
