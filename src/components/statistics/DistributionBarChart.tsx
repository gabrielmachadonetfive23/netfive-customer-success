"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import { formatPercent } from "@/lib/format";
import type { DistributionSlice } from "@/lib/services/statistics-analytics";

interface HoverState {
  label: string;
  companies: string[];
  x: number;
  y: number;
}

export function DistributionBarChart({ data }: { data: DistributionSlice[] }) {
  const [hovered, setHovered] = useState<HoverState | null>(null);

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-netfive-gray-500">Sem dados para exibir.</p>;
  }

  const maxCount = Math.max(1, ...data.map((entry) => entry.count));

  function handleEnter(event: MouseEvent<HTMLElement>, entry: DistributionSlice) {
    if (!entry.companies || entry.companies.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setHovered({ label: entry.label, companies: entry.companies, x: rect.left + rect.width / 2, y: rect.top });
  }

  return (
    <div className="space-y-2">
      {data.map((entry) => (
        <div key={entry.label} className="grid grid-cols-[120px_1fr_90px] items-center gap-3">
          <span className="truncate text-sm text-netfive-gray-100">{entry.label}</span>
          <span
            className="h-3 overflow-hidden rounded-full bg-netfive-overlay/5"
            onMouseEnter={(event) => handleEnter(event, entry)}
            onMouseLeave={() => setHovered((prev) => (prev?.label === entry.label ? null : prev))}
          >
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

      {hovered &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-netfive-border bg-netfive-surface p-3 shadow-glass-sm"
            style={{ left: hovered.x, top: hovered.y - 8 }}
          >
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-netfive-gray-500">
              {hovered.label} · {hovered.companies.length} empresa{hovered.companies.length > 1 ? "s" : ""}
            </p>
            <ul className="max-h-52 space-y-0.5 overflow-y-auto text-sm text-netfive-gray-100">
              {hovered.companies.map((company) => (
                <li key={company} className="truncate">
                  {company}
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
