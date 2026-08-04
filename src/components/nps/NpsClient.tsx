"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { computeNpsSummary } from "@/lib/services/nps-analytics";
import { npsCategoryBadgeTone } from "@/lib/nps-tone";
import { formatDate } from "@/lib/format";
import { NpsShield } from "@/components/nps/NpsShield";
import { NpsResponseForm } from "@/components/nps/NpsResponseForm";
import { TrashIcon } from "@/components/icons";
import type { NpsResponseDTO } from "@/lib/types";

export function NpsClient() {
  const [responses, setResponses] = useState<NpsResponseDTO[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<NpsResponseDTO | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setIsLoading(true);
    setError(null);
    apiFetch<NpsResponseDTO[]>("/api/nps")
      .then(setResponses)
      .catch(() => setError("Não foi possível carregar as respostas de NPS."))
      .finally(() => setIsLoading(false));
  }

  const summary = useMemo(() => computeNpsSummary(responses ?? []), [responses]);

  function handleSaved(saved: NpsResponseDTO) {
    setResponses((prev) => {
      const list = prev ?? [];
      const exists = list.some((r) => r.id === saved.id);
      const next = exists ? list.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...list];
      return next;
    });
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta empresa da lista de NPS?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/nps/${id}`, { method: "DELETE" });
      setResponses((prev) => (prev ?? []).filter((r) => r.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : "Não foi possível remover.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-netfive-gray-100">NPS</h1>
        <p className="text-sm text-netfive-gray-500">Pesquisa de satisfação — cadastro manual das empresas participantes.</p>
      </div>

      {error && <div className="glass-card p-4 text-sm text-netfive-red">{error}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="glass-panel h-80 animate-pulse" />
          <div className="glass-panel h-80 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass-panel flex flex-col items-center justify-center gap-6 p-8">
            <NpsShield score={summary.score} />
            <div className="grid w-full grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-semibold text-emerald-400">{summary.promoters}</p>
                <p className="text-xs text-netfive-gray-500">Promotores</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-amber-400">{summary.passives}</p>
                <p className="text-xs text-netfive-gray-500">Neutros</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-netfive-red">{summary.detractors}</p>
                <p className="text-xs text-netfive-gray-500">Detratores</p>
              </div>
            </div>
            <p className="text-xs text-netfive-gray-500">
              {summary.totalParticipants} empresa{summary.totalParticipants !== 1 ? "s" : ""} participante
              {summary.totalParticipants !== 1 ? "s" : ""}
              {summary.scoredCount !== summary.totalParticipants && ` · ${summary.scoredCount} com nota lançada`}
            </p>
          </div>

          <div className="space-y-4">
            <NpsResponseForm editing={editing} onSaved={handleSaved} onCancel={() => setEditing(null)} />

            <div className="glass-panel overflow-hidden">
              <h2 className="border-b border-netfive-border px-4 py-3 text-sm font-semibold text-netfive-gray-100">
                Empresas participantes
              </h2>
              {(responses ?? []).length === 0 ? (
                <p className="p-6 text-center text-sm text-netfive-gray-500">
                  Nenhuma empresa cadastrada ainda — use o formulário acima para adicionar.
                </p>
              ) : (
                <div className="max-h-[410px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-netfive-surface">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">Empresa</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">Nota</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">Categoria</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">Data</th>
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {(responses ?? []).map((response) => (
                        <tr key={response.id} className="border-t border-netfive-border">
                          <td className="px-4 py-2 text-netfive-gray-200">{response.companyName}</td>
                          <td className="px-4 py-2 text-netfive-gray-300">{response.score ?? "—"}</td>
                          <td className="px-4 py-2">
                            {response.category && (
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${npsCategoryBadgeTone(response.category)}`}>
                                {response.category}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-netfive-gray-300">{formatDate(response.respondedAt)}</td>
                          <td className="px-4 py-2">
                            <div className="flex justify-end gap-2">
                              <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => setEditing(response)}>
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn-secondary px-2 py-1 text-xs text-netfive-red"
                                onClick={() => handleDelete(response.id)}
                                disabled={deletingId === response.id}
                                aria-label={`Remover ${response.companyName}`}
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
