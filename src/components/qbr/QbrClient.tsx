"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { qbrStatusBadgeTone, qbrStatusTextTone } from "@/lib/qbr-tone";
import { KpiCard } from "@/components/ui/KpiCard";
import { SearchInput } from "@/components/filters/FilterControls";
import { QbrMultiSelect } from "@/components/qbr/QbrMultiSelect";
import { ChevronUpDownIcon, ExternalLinkIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import type { QbrActivityDTO } from "@/lib/types";

interface FilterOptions {
  clientes: string[];
  teams: string[];
  statuses: string[];
}

export function QbrClient() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [clientes, setClientes] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [activities, setActivities] = useState<QbrActivityDTO[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<FilterOptions>({ clientes: [], teams: [], statuses: [] });

  useEffect(() => {
    apiFetch<FilterOptions>("/api/qbr/filter-options")
      .then(setOptions)
      .catch(() => setOptions({ clientes: [], teams: [], statuses: [] }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (clientes.length > 0) params.set("clientes", clientes.join(","));
    if (teams.length > 0) params.set("teams", teams.join(","));
    if (status) params.set("status", status);
    if (overdueOnly) params.set("overdueOnly", "true");

    apiFetch<QbrActivityDTO[]>(`/api/qbr?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setActivities(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar as atividades de QBR/SBR.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, clientes, teams, status, overdueOnly]);

  const kpis = useMemo(() => {
    const list = activities ?? [];
    return {
      total: list.length,
      overdue: list.filter((a) => a.overdue).length,
      emAtendimento: list.filter((a) => a.status === "Em atendimento").length,
      aguardandoCliente: list.filter((a) => a.status === "Aguardando cliente").length,
    };
  }, [activities]);

  const groups = useMemo(() => {
    const map = new Map<string, QbrActivityDTO[]>();
    for (const activity of activities ?? []) {
      const key = activity.cliente ?? "Sem cliente";
      const list = map.get(key) ?? [];
      list.push(activity);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activities]);

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-netfive-gray-100">QBR/SBR</h1>
        <p className="text-sm text-netfive-gray-500">
          Atividades em aberto importadas do Notion, agrupadas por cliente — sincronizado periodicamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Atividades em aberto" value={kpis.total} />
        <KpiCard label="Atrasadas" value={kpis.overdue} tone={kpis.overdue > 0 ? "critical" : "neutral"} />
        <KpiCard label="Em atendimento" value={kpis.emAtendimento} />
        <KpiCard label="Aguardando cliente" value={kpis.aguardandoCliente} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Buscar por atividade, cliente ou Agidesk..." />
        <QbrMultiSelect label="Cliente" options={options.clientes} selected={clientes} onChange={setClientes} />
        <QbrMultiSelect label="Equipe" options={options.teams} selected={teams} onChange={setTeams} />
        <select className="input-field w-auto" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          {options.statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-netfive-gray-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-netfive-border bg-transparent text-netfive-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
            checked={overdueOnly}
            onChange={(event) => setOverdueOnly(event.target.checked)}
          />
          Somente atrasadas
        </label>
      </div>

      {error && <div className="glass-card p-4 text-sm text-netfive-red">{error}</div>}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="glass-card h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {groups.length === 0 && (
            <div className="glass-card p-6 text-center text-sm text-netfive-gray-500">
              Nenhuma atividade encontrada com os filtros atuais.
            </div>
          )}

          <div className="space-y-3">
            {groups.map(([cliente, items]) => {
              const isCollapsed = collapsed.has(cliente);
              const overdueCount = items.filter((a) => a.overdue).length;

              return (
                <div key={cliente} className="glass-panel overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() => toggleGroup(cliente)}
                    aria-expanded={!isCollapsed}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-netfive-gray-100">{cliente}</span>
                      <span className="rounded-full bg-netfive-overlay/[0.06] px-2 py-0.5 text-xs text-netfive-gray-500">
                        {items.length}
                      </span>
                      {overdueCount > 0 && (
                        <span className="rounded-full bg-netfive-red/15 px-2 py-0.5 text-xs font-medium text-netfive-red">
                          {overdueCount} atrasada{overdueCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <ChevronUpDownIcon className={`h-4 w-4 shrink-0 text-netfive-gray-500 transition-transform ${isCollapsed ? "" : "rotate-180"}`} />
                  </button>

                  {!isCollapsed && (
                    <div className="border-t border-netfive-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">
                            <th className="px-4 py-2">Atividade</th>
                            <th className="px-4 py-2">Equipe</th>
                            <th className="px-4 py-2">Responsável</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Vencimento</th>
                            <th className="px-4 py-2">Agidesk</th>
                            <th className="px-4 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((activity) => (
                            <tr key={activity.id} className="border-t border-netfive-border">
                              <td className="px-4 py-2 text-netfive-gray-200">{activity.activity}</td>
                              <td className="px-4 py-2 text-netfive-gray-300">{activity.team ?? "—"}</td>
                              <td className="px-4 py-2 text-netfive-gray-300">{activity.responsavel ?? "—"}</td>
                              <td className="px-4 py-2">
                                {activity.status && (
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${qbrStatusBadgeTone(activity.status)}`}>
                                    {activity.status}
                                  </span>
                                )}
                              </td>
                              <td className={`px-4 py-2 font-medium ${activity.overdue ? "text-netfive-red" : qbrStatusTextTone(activity.status)}`}>
                                {formatDate(activity.dueDate)}
                                {activity.overdue && " · atrasada"}
                              </td>
                              <td className="px-4 py-2 text-netfive-gray-500">{activity.agidesk ?? "—"}</td>
                              <td className="px-4 py-2">
                                <a
                                  href={activity.notionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-netfive-red hover:underline"
                                >
                                  Notion <ExternalLinkIcon className="h-3 w-3" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
