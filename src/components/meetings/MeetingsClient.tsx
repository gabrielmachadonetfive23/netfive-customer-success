"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { generateMeetingTips } from "@/lib/services/alfred-tips";
import { SearchInput } from "@/components/filters/FilterControls";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { AlfredBanner, openAlfredTip } from "@/components/alfred/AlfredBanner";
import type { MeetingDTO } from "@/lib/types";

export function MeetingsClient() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [platform, setPlatform] = useState("");

  const [meetings, setMeetings] = useState<MeetingDTO[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<MeetingDTO[]>("/api/meetings")
      .then(setMeetings)
      .catch(() => setError("Não foi possível carregar as reuniões."))
      .finally(() => setIsLoading(false));
  }, []);

  const platforms = useMemo(() => {
    const set = new Set((meetings ?? []).map((m) => m.platform).filter((p): p is string => Boolean(p)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [meetings]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (meetings ?? []).filter((meeting) => {
      if (platform && meeting.platform !== platform) return false;
      if (!term) return true;
      const haystack = [
        meeting.title,
        meeting.summary ?? "",
        ...meeting.participants.map((p) => `${p.name} ${p.email}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [meetings, search, platform]);

  const alfredTips = useMemo(() => generateMeetingTips(filtered), [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-netfive-gray-100">Reuniões</h1>
        <p className="text-sm text-netfive-gray-500">Sincronizado do Read.ai — resumo, itens de ação e participantes de cada reunião.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Buscar por título, resumo ou participante..." />
        {platforms.length > 0 && (
          <select className="input-field w-auto" value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Filtrar por plataforma">
            <option value="">Todas as plataformas</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      <AlfredBanner tips={alfredTips} onSelectTip={(tip) => openAlfredTip(tip)} />

      {error && <div className="glass-card p-4 text-sm text-netfive-red">{error}</div>}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="glass-card h-20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-6 text-center text-sm text-netfive-gray-500">
          {(meetings ?? []).length === 0
            ? "Nenhuma reunião sincronizada ainda."
            : "Nenhuma reunião encontrada com os filtros atuais."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
