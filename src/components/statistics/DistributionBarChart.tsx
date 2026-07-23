import { formatPercent } from "@/lib/format";
import type { DistributionSlice } from "@/lib/services/statistics-analytics";

export function DistributionBarChart({ data }: { data: DistributionSlice[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-netfive-gray-500">Sem dados para exibir.</p>;
  }

  const maxCount = Math.max(1, ...data.map((entry) => entry.count));

  return (
    <div className="space-y-2">
      {data.map((entry) => (
        <div key={entry.label} className="grid grid-cols-[120px_1fr_90px] items-center gap-3">
          <span className="truncate text-sm text-netfive-gray-100">{entry.label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-white/5">
            <span
              className="block h-full rounded-full bg-netfive-red"
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
