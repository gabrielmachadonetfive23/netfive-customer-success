"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUpDownIcon } from "@/components/icons";

interface SegmentFilterSelectProps {
  segments: readonly string[];
  selectedSegments: string[];
  onChange: (segments: string[]) => void;
}

/** Filtro de segmentos com seleção múltipla — notícia aparece se tiver QUALQUER um dos segmentos marcados. */
export function SegmentFilterSelect({ segments, selectedSegments, onChange }: SegmentFilterSelectProps) {
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

  function toggle(segment: string) {
    if (selectedSegments.includes(segment)) {
      onChange(selectedSegments.filter((s) => s !== segment));
    } else {
      onChange([...selectedSegments, segment]);
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
        Segmentos
        {selectedSegments.length > 0 && (
          <span className="rounded-full bg-netfive-red px-1.5 py-0.5 text-xs font-medium text-white">
            {selectedSegments.length}
          </span>
        )}
        <ChevronUpDownIcon className="h-3.5 w-3.5 text-netfive-gray-500" />
      </button>

      {open && (
        <div className="glass-panel absolute z-20 mt-2 w-72 p-3">
          <div
            role="group"
            aria-label="Seleção de segmentos"
            className="max-h-64 overflow-y-auto rounded-lg border border-netfive-border bg-netfive-overlay/[0.02] p-2"
          >
            {segments.map((segment) => (
              <label
                key={segment}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-netfive-gray-200 hover:bg-netfive-overlay/5"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-netfive-border bg-transparent text-netfive-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
                  checked={selectedSegments.includes(segment)}
                  onChange={() => toggle(segment)}
                />
                <span>{segment}</span>
              </label>
            ))}
          </div>
          {selectedSegments.length > 0 && (
            <button type="button" className="btn-secondary mt-2 w-full" onClick={() => onChange([])}>
              Limpar seleção
            </button>
          )}
        </div>
      )}
    </div>
  );
}
