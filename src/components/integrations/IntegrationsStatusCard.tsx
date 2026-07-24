"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { useDataRefresh } from "@/lib/contexts/DataRefreshContext";

interface ProviderStatus {
  provider: "smartsheet" | "pipedrive";
  configured: boolean;
  linkedCustomers: number;
  lastSuccessAt: string | null;
  lastError: { message: string; at: string } | null;
}

const PROVIDER_LABELS: Record<ProviderStatus["provider"], string> = {
  smartsheet: "Smartsheet",
  pipedrive: "Pipedrive",
};

export function IntegrationsStatusCard() {
  const [status, setStatus] = useState<ProviderStatus[] | null>(null);
  const { version } = useDataRefresh();

  useEffect(() => {
    apiFetch<ProviderStatus[]>("/api/integrations/status")
      .then(setStatus)
      .catch(() => setStatus([]));
  }, [version]);

  if (!status) return null;

  return (
    <div className="glass-card p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-netfive-gray-500">
        Integrações (duas vias)
      </p>
      <div className="space-y-3">
        {status.map((item) => (
          <div key={item.provider} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-netfive-gray-100">{PROVIDER_LABELS[item.provider]}</p>
              <p className="text-xs text-netfive-gray-500">
                {item.configured ? `${item.linkedCustomers} cliente(s) vinculado(s)` : "Não configurado"}
              </p>
              {item.lastError && (
                <p className="text-xs text-netfive-red">Última falha: {formatDateTime(item.lastError.at)}</p>
              )}
            </div>
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                !item.configured ? "bg-netfive-gray-700" : item.lastError ? "bg-amber-500" : "bg-emerald-500"
              }`}
              aria-hidden
            />
          </div>
        ))}
      </div>
    </div>
  );
}
