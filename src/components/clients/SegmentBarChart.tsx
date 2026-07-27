import { formatPercent } from "@/lib/format";
import type { SegmentSlice } from "@/lib/services/clients-analytics";

export function SegmentBarChart({ data }: { data: SegmentSlice[] }) {
  if (data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-netfive-gray-500">Sem dados para exibir.</div>;
  }

  const maxCount = Math.max(1, ...data.map((entry) => entry.count));

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {data.map((entry) => (
        <div key={entry.segment} className="grid grid-cols-[1fr_2fr_90px] items-center gap-3">
          <span className="truncate text-sm text-netfive-gray-100" title={entry.segment}>
            {entry.segment}
          </span>
          <span className="h-3 overflow-hidden rounded-full bg-netfive-overlay/5">
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
