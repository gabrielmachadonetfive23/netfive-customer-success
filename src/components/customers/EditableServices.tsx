"use client";

import { useState } from "react";
import { ServiceMultiSelect } from "@/components/customers/ServiceMultiSelect";
import type { ServiceOption } from "@/lib/types";

interface EditableServicesProps {
  services: ServiceOption[];
  selectedIds: string[];
  onSave: (serviceIds: string[]) => Promise<void>;
}

/** Chips de serviços que, ao serem clicados, abrem o seletor múltiplo inline. Salva ao fechar. */
export function EditableServices({ services, selectedIds, onSave }: EditableServicesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  const selectedServices = services.filter((s) => selectedIds.includes(s.id));

  async function handleClose() {
    const changed =
      draft.length !== selectedIds.length || draft.some((id) => !selectedIds.includes(id));

    if (!changed) {
      setIsEditing(false);
      return;
    }

    setStatus("saving");
    try {
      await onSave(draft);
      setStatus("idle");
      setIsEditing(false);
    } catch {
      setStatus("error");
    }
  }

  if (!isEditing) {
    return (
      <div>
        <dt className="mb-1 text-xs text-netfive-gray-500">Serviços</dt>
        <dd>
          <button
            type="button"
            onClick={() => {
              setDraft(selectedIds);
              setIsEditing(true);
            }}
            className="flex w-full flex-wrap gap-1.5 rounded px-1 -mx-1 py-1 text-left hover:bg-netfive-overlay/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
          >
            {selectedServices.length === 0 && <span className="text-sm text-netfive-gray-500">—</span>}
            {selectedServices.map((service) => (
              <span
                key={service.id}
                className="rounded-full border border-netfive-border bg-netfive-overlay/5 px-2.5 py-1 text-xs text-netfive-gray-200"
              >
                {service.name}
              </span>
            ))}
          </button>
        </dd>
      </div>
    );
  }

  return (
    <div>
      <ServiceMultiSelect services={services} selectedIds={draft} onChange={setDraft} />
      <div className="mt-2 flex items-center gap-3">
        <button type="button" className="btn-secondary px-3 py-1.5" onClick={handleClose} disabled={status === "saving"}>
          {status === "saving" ? "Salvando..." : "Concluir"}
        </button>
        {status === "error" && <span className="text-xs text-netfive-red">Erro ao salvar. Tente de novo.</span>}
      </div>
    </div>
  );
}
