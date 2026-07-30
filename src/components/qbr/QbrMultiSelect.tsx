"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUpDownIcon } from "@/components/icons";

interface QbrMultiSelectProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

/** Filtro genérico de seleção múltipla por popover — usado para Cliente e Equipe na aba QBR/SBR. */
export function QbrMultiSelect({ label, options, selected, onChange }: QbrMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="input-field flex w-auto items-center gap-2"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {label}
        {selected.length > 0 && (
          <span className="rounded-full bg-netfive-red px-1.5 py-0.5 text-xs font-medium text-white">
            {selected.length}
          </span>
        )}
        <ChevronUpDownIcon className="h-3.5 w-3.5 text-netfive-gray-500" />
      </button>

      {open && (
        <div className="glass-panel absolute z-20 mt-2 w-72 p-3">
          <div
            role="group"
            aria-label={`Seleção de ${label}`}
            className="max-h-64 overflow-y-auto rounded-lg border border-netfive-border bg-netfive-overlay/[0.02] p-2"
          >
            {options.length === 0 && <p className="px-2 py-2 text-sm text-netfive-gray-500">Nenhuma opção disponível.</p>}
            {options.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-netfive-gray-200 hover:bg-netfive-overlay/5"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-netfive-border bg-transparent text-netfive-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button type="button" className="btn-secondary mt-2 w-full" onClick={() => onChange([])}>
              Limpar seleção
            </button>
          )}
        </div>
      )}
    </div>
  );
}
