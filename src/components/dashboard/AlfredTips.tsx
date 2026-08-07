"use client";

import { useEffect, useMemo, useState } from "react";
import { useCustomerDrawer } from "@/lib/hooks/useCustomerDrawer";
import { generateAlfredTips, type AlfredTipSeverity } from "@/lib/services/alfred-tips";
import { AlfredIcon } from "@/components/icons";
import type { CustomerDTO } from "@/lib/types";

const ROTATE_MS = 7000;
const MAX_DOTS = 8;

const SEVERITY_DOT_COLOR: Record<AlfredTipSeverity, string> = {
  critical: "bg-netfive-red",
  warning: "bg-amber-500",
  info: "bg-netfive-gray-500",
};

interface AlfredTipsProps {
  customers: CustomerDTO[];
}

export function AlfredTips({ customers }: AlfredTipsProps) {
  const { openCustomer } = useCustomerDrawer();
  const tips = useMemo(() => generateAlfredTips(customers, new Date()), [customers]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [tips.length]);

  useEffect(() => {
    if (paused || tips.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % tips.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, tips.length]);

  const tip = tips[index] ?? null;

  return (
    <div
      className="glass-panel relative overflow-hidden border-netfive-red/25 shadow-glow-red-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-netfive-red/[0.09] via-transparent to-transparent" />

      <div className="relative flex items-center gap-4 px-5 py-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-netfive-red/15 text-netfive-red shadow-glow-red-sm">
          <AlfredIcon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-netfive-red">Dicas do Alfred</p>

          {tip ? (
            <div className="mt-0.5 flex items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT_COLOR[tip.severity]}`} aria-hidden />
              <button
                type="button"
                onClick={() => openCustomer(tip.customerId)}
                className="min-w-0 truncate text-left text-sm font-medium text-netfive-gray-100 hover:underline"
                title={tip.message}
              >
                {tip.message}
              </button>
            </div>
          ) : (
            <p className="mt-0.5 text-sm font-medium text-netfive-gray-100">
              Tudo em dia por aqui — nenhum alerta no momento.
            </p>
          )}
        </div>

        {tips.length > 1 && (
          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            {tips.length <= MAX_DOTS ? (
              tips.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  aria-label={`Dica ${i + 1} de ${tips.length}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-netfive-red" : "w-1.5 bg-netfive-gray-700/40"
                  }`}
                />
              ))
            ) : (
              <span className="text-xs font-medium text-netfive-gray-500">
                {index + 1}/{tips.length}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
