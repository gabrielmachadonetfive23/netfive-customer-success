"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { ExternalLinkIcon } from "@/components/icons";

interface PipedriveDeal {
  id: number;
  title: string;
  status: "open" | "won" | "lost" | "deleted";
  value: number;
  currency: string;
  add_time: string;
  close_time: string | null;
}

interface DealsResponse {
  linked: boolean;
  deals: PipedriveDeal[];
  organizationUrl: string | null;
}

const STATUS_LABELS: Record<PipedriveDeal["status"], string> = {
  open: "Em aberto",
  won: "Ganho",
  lost: "Perdido",
  deleted: "Excluído",
};

const STATUS_COLORS: Record<PipedriveDeal["status"], string> = {
  open: "bg-blue-500/15 text-blue-300",
  won: "bg-emerald-500/15 text-emerald-300",
  lost: "bg-netfive-red/15 text-netfive-red",
  deleted: "bg-netfive-gray-700/30 text-netfive-gray-500",
};

export function PipedriveDealsSection({ customerId }: { customerId: string }) {
  const [data, setData] = useState<DealsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<DealsResponse>(`/api/customers/${customerId}/pipedrive-deals`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar os negócios do Pipedrive.");
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (error) {
    return <p className="text-sm text-netfive-red">{error}</p>;
  }

  if (!data) {
    return <div className="h-16 animate-pulse rounded-lg bg-netfive-overlay/5" />;
  }

  if (!data.linked) {
    return <p className="text-sm text-netfive-gray-500">Cliente ainda não vinculado a uma organização no Pipedrive.</p>;
  }

  return (
    <div className="space-y-3">
      {data.deals.length === 0 ? (
        <p className="text-sm text-netfive-gray-500">Nenhum negócio encontrado para esta organização.</p>
      ) : (
        <ul className="space-y-2">
          {data.deals.map((deal) => (
            <li key={deal.id} className="glass-card flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-netfive-gray-100">{deal.title}</p>
                <p className="text-xs text-netfive-gray-500">
                  {formatDate(deal.close_time ?? deal.add_time)} · {formatCurrency(deal.value, deal.currency)}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[deal.status]}`}>
                {STATUS_LABELS[deal.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
      {data.organizationUrl && (
        <a
          href={data.organizationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-netfive-gray-500 hover:text-netfive-gray-100"
        >
          <ExternalLinkIcon className="h-3 w-3" />
          Ir para o Pipedrive
        </a>
      )}
    </div>
  );
}
