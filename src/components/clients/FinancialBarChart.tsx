"use client";

import { formatCurrencyBRL } from "@/lib/format";
import type { FinancialBarEntry } from "@/lib/services/clients-analytics";

export function FinancialBarChart({
  data,
  onSelect,
}: {
  data: FinancialBarEntry[];
  onSelect: (customerId: string) => void;
}) {
  if (data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-netfive-gray-500">Sem dados para exibir.</div>;
  }

  const maxValue = Math.max(1, ...data.map((entry) => entry.value ?? 0));

  return (
    <div className="space-y-2">
      <p className="text-xs text-netfive-gray-500">
        Somente dados públicos encontrados. A métrica pode variar entre faturamento, receita bruta e receita
        líquida. Abra o cliente para consultar a fonte.
      </p>
      <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {data.map((entry) => {
          const widthPercent = entry.value !== null ? Math.max(2, (entry.value / maxValue) * 100) : 0;
          return (
            <button
              key={entry.customerId}
              type="button"
              onClick={() => onSelect(entry.customerId)}
              className="grid w-full grid-cols-[160px_1fr_140px] items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-netfive-overlay/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
            >
              <span className="truncate text-sm text-netfive-gray-100">{entry.companyName}</span>
              <span className="h-3 overflow-hidden rounded-full bg-netfive-overlay/5">
                {entry.value !== null && (
                  <span className="block h-full rounded-full bg-netfive-red" style={{ width: `${widthPercent}%` }} />
                )}
              </span>
              <span className="text-right text-xs text-netfive-gray-300">
                {entry.value !== null ? formatCurrencyBRL(entry.value) : "—"}
                {entry.hasVerifiedSource && <span className="ml-1 text-emerald-400">· Fonte verificada</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
