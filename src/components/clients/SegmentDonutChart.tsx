"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPercent } from "@/lib/format";
import type { SegmentSlice } from "@/lib/services/clients-analytics";

const COLORS = ["#e11d2e", "#f4f4f5", "#a1a1aa", "#52525b", "#7f1d1d", "#d4d4d8", "#3f3f46", "#fca5a5"];

export function SegmentDonutChart({ data }: { data: SegmentSlice[] }) {
  if (data.length === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-netfive-gray-500">Sem dados para exibir.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="segment"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.segment} fill={COLORS[index % COLORS.length]} stroke="#0a0a0b" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#131316", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
          formatter={(value: number, _name, item) => [
            `${value} (${formatPercent(item.payload.percent)})`,
            item.payload.segment,
          ]}
        />
        <Legend
          formatter={(value, entry) => {
            const payload = (entry as unknown as { payload?: SegmentSlice }).payload;
            return (
              <span className="text-xs text-netfive-gray-300">
                {value} — {payload?.count ?? 0} ({formatPercent(payload?.percent ?? 0)})
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
