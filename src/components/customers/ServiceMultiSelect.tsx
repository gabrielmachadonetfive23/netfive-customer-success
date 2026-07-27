"use client";

import { useMemo, useState } from "react";
import type { ServiceOption } from "@/lib/types";

interface ServiceMultiSelectProps {
  services: ServiceOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ServiceMultiSelect({ services, selectedIds, onChange }: ServiceMultiSelectProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return services;
    return services.filter((service) => service.name.toLowerCase().includes(term));
  }, [services, search]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="service-search" className="field-label mb-0">
          Serviços
        </label>
        <span className="text-xs text-netfive-gray-500">{selectedIds.length} selecionado(s)</span>
      </div>
      <input
        id="service-search"
        type="search"
        className="input-field mb-2"
        placeholder="Pesquisar serviço..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div
        role="group"
        aria-label="Seleção de serviços"
        className="max-h-56 overflow-y-auto rounded-lg border border-netfive-border bg-netfive-overlay/[0.02] p-2"
      >
        {filtered.length === 0 && (
          <p className="px-2 py-2 text-sm text-netfive-gray-500">Nenhum serviço encontrado.</p>
        )}
        {filtered.map((service) => (
          <label
            key={service.id}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-netfive-gray-200 hover:bg-netfive-overlay/5"
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-netfive-border bg-transparent text-netfive-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
              checked={selectedIds.includes(service.id)}
              onChange={() => toggle(service.id)}
            />
            <span>{service.name}</span>
            {!service.active && <span className="text-xs text-netfive-gray-700">(legado)</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
