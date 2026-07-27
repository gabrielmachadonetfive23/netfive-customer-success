"use client";

import { useMemo, useState } from "react";
import { useCustomerAnalytics } from "@/lib/hooks/useCustomerAnalytics";
import { useCustomerDrawer } from "@/lib/hooks/useCustomerDrawer";
import { computeVisitsKpis, getUpcomingVisits } from "@/lib/services/visits-analytics";
import { KpiCard } from "@/components/ui/KpiCard";
import { CsOwnerSelect, uniqueCsOwners } from "@/components/filters/FilterControls";

const MONTH_LABELS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function VisitsClient() {
  const { openCustomer } = useCustomerDrawer();
  const [csOwner, setCsOwner] = useState("");

  const { customers: allCustomers } = useCustomerAnalytics({});
  const { customers, isLoading, error } = useCustomerAnalytics({ csOwner: csOwner || undefined });

  const now = useMemo(() => new Date(), []);
  const kpis = computeVisitsKpis(customers, now);
  const visits = getUpcomingVisits(customers, now);
  const csOwnerOptions = uniqueCsOwners(allCustomers);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-netfive-gray-100">Visitas</h1>
        <CsOwnerSelect value={csOwner} onChange={setCsOwner} options={csOwnerOptions} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Visitas agendadas" value={kpis.scheduledVisits} />
        <KpiCard label="Próximos 30 dias" value={kpis.visitsNext30Days} />
        <KpiCard label="Customer Success com agenda" value={kpis.csWithSchedule} />
        <KpiCard label="Sem próxima visita" value={kpis.customersWithoutNextVisit} />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="glass-card h-28 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="glass-card p-6 text-center text-sm text-netfive-red">{error}</div>
      )}

      {!isLoading && !error && visits.length === 0 && (
        <div className="glass-card p-8 text-center text-sm text-netfive-gray-500">
          Nenhuma visita agendada a partir de hoje.
        </div>
      )}

      {!isLoading && !error && visits.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visits.map((visit) => (
            <button
              key={visit.customerId}
              type="button"
              onClick={() => openCustomer(visit.customerId)}
              className="glass-card flex items-start gap-4 p-4 text-left transition-colors hover:bg-netfive-overlay/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-netfive-red"
            >
              <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-netfive-border bg-netfive-overlay/5 py-2">
                <span className="text-xl font-bold text-netfive-gray-100">{visit.day}</span>
                <span className="text-xs uppercase text-netfive-gray-500">{MONTH_LABELS[visit.month - 1]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-netfive-gray-100">{visit.companyName}</p>
                <p className="text-xs text-netfive-gray-500">{visit.csOwner}</p>
                <p className="mt-1 truncate text-sm text-netfive-gray-300">{visit.actionLabel}</p>
                <p className="mt-1 text-xs font-medium text-netfive-red">
                  {visit.isToday ? "Hoje" : `${visit.daysUntil} dia(s)`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
