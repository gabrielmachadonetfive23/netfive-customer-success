"use client";

import { useEffect, useRef, useState } from "react";
import { ServiceMultiSelect } from "@/components/customers/ServiceMultiSelect";
import { ChevronUpDownIcon } from "@/components/icons";
import type { ServiceOption } from "@/lib/types";

interface ServiceFilterSelectProps {
  services: ServiceOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/** Filtro de serviços com seleção múltipla — cliente aparece se tiver QUALQUER um dos serviços marcados. */
export function ServiceFilterSelect({ services, selectedIds, onChange }: ServiceFilterSelectProps) {
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="input-field flex w-auto items-center gap-2"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        Serviços
        {selectedIds.length > 0 && (
          <span className="rounded-full bg-netfive-red px-1.5 py-0.5 text-xs font-medium text-white">
            {selectedIds.length}
          </span>
        )}
        <ChevronUpDownIcon className="h-3.5 w-3.5 text-netfive-gray-500" />
      </button>

      {open && (
        <div className="glass-panel absolute z-20 mt-2 w-80 p-3">
          <ServiceMultiSelect services={services} selectedIds={selectedIds} onChange={onChange} />
          {selectedIds.length > 0 && (
            <button type="button" className="btn-secondary mt-2 w-full" onClick={() => onChange([])}>
              Limpar seleção
            </button>
          )}
        </div>
      )}
    </div>
  );
}
