import { STATUS_COLORS, HEALTH_STATUS_TEXT_COLOR } from "@/components/customers/HealthScoreBar";
import { formatPercent } from "@/lib/format";
import type { HealthStatusSlice } from "@/lib/services/statistics-analytics";

/**
 * Distribuição de clientes por status de saúde. Ao contrário do
 * DistributionBarChart (magnitude, matiz única), aqui a cor É o dado —
 * cada status carrega seu significado de severidade (verde/amarelo/
 * vermelho/cinza), então cada barra usa a cor reservada do seu status.
 */
export function HealthStatusBarChart({ data }: { data: HealthStatusSlice[] }) {
  const maxCount = Math.max(1, ...data.map((entry) => entry.count));

  return (
    <div className="space-y-2">
      {data.map((entry) => (
        <div key={entry.status} className="grid grid-cols-[110px_1fr_90px] items-center gap-3">
          <span className={`truncate text-sm font-medium ${HEALTH_STATUS_TEXT_COLOR[entry.status]}`}>{entry.status}</span>
          <span className="h-3 overflow-hidden rounded-full bg-white/5">
            <span
              className={`block h-full rounded-full ${STATUS_COLORS[entry.status]}`}
              style={{ width: `${Math.max(2, (entry.count / maxCount) * 100)}%` }}
            />
          </span>
          <span className="text-right text-xs text-netfive-gray-400">
            {entry.count} ({formatPercent(entry.percent)})
          </span>
        </div>
      ))}
    </div>
  );
}
