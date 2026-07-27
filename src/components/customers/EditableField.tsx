"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/format";

export type EditableFieldKind = "text" | "textarea" | "date" | "number" | "url" | "select";

export interface EditableFieldOption {
  value: string;
  label: string;
}

interface EditableFieldProps {
  label: string;
  value: string | number | null;
  kind?: EditableFieldKind;
  options?: EditableFieldOption[];
  onSave: (value: string | number | null | undefined) => Promise<void>;
}

/** Formata o valor para exibição somente-leitura (fora do modo de edição). */
function displayValue(value: string | number | null, kind: EditableFieldKind, options?: EditableFieldOption[]): string {
  if (value === null || value === undefined || value === "") return "—";
  if (kind === "date") return formatDate(String(value));
  if (kind === "select") return options?.find((o) => o.value === String(value))?.label ?? String(value);
  return String(value);
}

/**
 * Campo que exibe o valor atual e, ao ser clicado, vira um input editável.
 * Salva automaticamente ao perder o foco (ou Enter em campos de uma linha),
 * sem precisar de um modo de edição separado. Esc cancela a alteração.
 */
export function EditableField({ label, value, kind = "text", options, onSave }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value === null || value === undefined ? "" : String(value));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value === null || value === undefined ? "" : String(value));
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  async function commit() {
    const normalized = draft.trim();
    const currentAsString = value === null || value === undefined ? "" : String(value);
    if (normalized === currentAsString) {
      setIsEditing(false);
      return;
    }

    setStatus("saving");
    try {
      // Campos numéricos aceitam null quando vazios; os demais (texto, data,
      // url, select) esperam undefined — a validação do servidor não aceita
      // null para eles (apenas ausência do campo).
      let parsed: string | number | null | undefined = normalized === "" ? undefined : normalized;
      if (kind === "number") {
        if (normalized === "") {
          parsed = null;
        } else {
          const num = Number(normalized);
          parsed = Number.isNaN(num) ? null : num;
        }
      }
      await onSave(parsed);
      setStatus("idle");
      setIsEditing(false);
    } catch {
      setStatus("error");
    }
  }

  function cancel() {
    setDraft(value === null || value === undefined ? "" : String(value));
    setIsEditing(false);
    setStatus("idle");
  }

  if (!isEditing) {
    return (
      <div>
        <dt className="text-xs text-netfive-gray-500">{label}</dt>
        <dd>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full rounded px-1 -mx-1 py-0.5 text-left text-sm text-netfive-gray-100 hover:bg-netfive-overlay/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
          >
            {kind === "url" && value ? (
              <a
                href={String(value)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-netfive-red hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {String(value)}
              </a>
            ) : (
              displayValue(value, kind, options)
            )}
          </button>
        </dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-xs text-netfive-gray-500">{label}</dt>
      <dd className="relative">
        {kind === "textarea" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="input-field text-sm"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
            }}
          />
        ) : kind === "select" ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            className="input-field text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
            }}
          >
            {options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={kind === "date" ? "date" : kind === "number" ? "number" : kind === "url" ? "url" : "text"}
            className="input-field text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
          />
        )}
        {status === "saving" && <span className="mt-0.5 block text-xs text-netfive-gray-500">Salvando...</span>}
        {status === "error" && <span className="mt-0.5 block text-xs text-netfive-red">Erro ao salvar. Tente de novo.</span>}
      </dd>
    </div>
  );
}
