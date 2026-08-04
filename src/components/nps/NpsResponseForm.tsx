"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { toDateInputValue } from "@/lib/format";
import type { NpsResponseDTO } from "@/lib/types";

interface NpsResponseFormProps {
  editing: NpsResponseDTO | null;
  onSaved: (response: NpsResponseDTO) => void;
  onCancel: () => void;
}

export function NpsResponseForm({ editing, onSaved, onCancel }: NpsResponseFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [score, setScore] = useState("");
  const [respondedAt, setRespondedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCompanyName(editing?.companyName ?? "");
    setScore(editing?.score !== null && editing?.score !== undefined ? String(editing.score) : "");
    setRespondedAt(toDateInputValue(editing?.respondedAt ?? null));
    setNotes(editing?.notes ?? "");
    setError(null);
  }, [editing]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        companyName,
        score: score === "" ? null : Number(score),
        respondedAt: respondedAt || undefined,
        notes: notes || undefined,
      };

      const response = editing
        ? await apiFetch<NpsResponseDTO>(`/api/nps/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiFetch<NpsResponseDTO>("/api/nps", { method: "POST", body: JSON.stringify(payload) });

      onSaved(response);
      if (!editing) {
        setCompanyName("");
        setScore("");
        setRespondedAt("");
        setNotes("");
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Não foi possível salvar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-3 p-4">
      {error && (
        <div role="alert" className="rounded-lg border border-netfive-red/40 bg-netfive-red/10 px-3 py-2 text-sm text-netfive-red">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="nps-company" className="field-label">
            Empresa
          </label>
          <input
            id="nps-company"
            type="text"
            className="input-field"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="nps-score" className="field-label">
            Nota (0-10)
          </label>
          <input
            id="nps-score"
            type="number"
            min={0}
            max={10}
            step={1}
            className="input-field"
            placeholder="Ainda sem nota"
            value={score}
            onChange={(event) => setScore(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="nps-date" className="field-label">
            Data da resposta
          </label>
          <input
            id="nps-date"
            type="date"
            className="input-field"
            value={respondedAt}
            onChange={(event) => setRespondedAt(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="nps-notes" className="field-label">
            Observação
          </label>
          <input id="nps-notes" type="text" className="input-field" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting || !companyName}>
          {isSubmitting ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar empresa"}
        </button>
        {editing && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
