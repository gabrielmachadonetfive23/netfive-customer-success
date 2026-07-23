"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { ObservationDTO } from "@/lib/types";

interface ObservationsTimelineProps {
  customerId: string;
  observations: ObservationDTO[];
  defaultAuthor: string;
  onAdded: (observation: ObservationDTO) => void;
}

export function ObservationsTimeline({
  customerId,
  observations,
  defaultAuthor,
  onAdded,
}: ObservationsTimelineProps) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState(defaultAuthor);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...observations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting || !text.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const observation = await apiFetch<ObservationDTO>(`/api/customers/${customerId}/observations`, {
        method: "POST",
        body: JSON.stringify({ text, author: author || defaultAuthor }),
      });
      onAdded(observation);
      setText("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Não foi possível adicionar a observação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Histórico de observações</h3>

      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        {error && <p className="field-error">{error}</p>}
        <textarea
          className="input-field"
          rows={2}
          placeholder="Escreva uma nova observação..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label="Nova observação"
        />
        <div className="flex items-center gap-2">
          <input
            className="input-field"
            placeholder="Autor"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            aria-label="Autor da observação"
          />
          <button type="submit" className="btn-primary shrink-0" disabled={isSubmitting || !text.trim()}>
            {isSubmitting ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </form>

      <ol className="space-y-3">
        {sorted.length === 0 && <p className="text-sm text-netfive-gray-500">Nenhuma observação registrada.</p>}
        {sorted.map((observation) => (
          <li key={observation.id} className="glass-card p-3">
            <p className="text-sm text-netfive-gray-100">{observation.text}</p>
            <p className="mt-2 text-xs text-netfive-gray-500">
              {observation.author} · {formatDateTime(observation.createdAt)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
