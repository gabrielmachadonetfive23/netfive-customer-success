"use client";

import { useMemo, useState } from "react";
import { useCustomerAnalytics } from "@/lib/hooks/useCustomerAnalytics";
import { useCustomerDrawer } from "@/lib/hooks/useCustomerDrawer";
import {
  computeStatisticsKpis,
  getDistributionByCategory,
  getNoVisitCustomers,
  getOverdueContacts,
  getPortfolioByCsOwner,
  getTopNoContactCustomers,
} from "@/lib/services/statistics-analytics";
import { riskCountTone } from "@/lib/kpi-tone";
import { KpiCard } from "@/components/ui/KpiCard";
import { CsOwnerSelect, uniqueCsOwners } from "@/components/filters/FilterControls";
import { DistributionBarChart } from "@/components/statistics/DistributionBarChart";
import { formatDate } from "@/lib/format";

function PanelTable({
  title,
  emptyMessage,
  headers,
  rows,
}: {
  title: string;
  emptyMessage: string;
  headers: string[];
  rows: { key: string; cells: React.ReactNode[]; onClick: () => void }[];
}) {
  return (
    <div className="glass-panel p-4">
      <h2 className="mb-3 text-sm font-semibold text-netfive-gray-100">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-netfive-gray-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className="cursor-pointer border-t border-netfive-border transition-colors hover:bg-netfive-red/[0.06]"
                  tabIndex={0}
                  onClick={row.onClick}
                  onKeyDown={(event) => event.key === "Enter" && row.onClick()}
                >
                  {row.cells.map((cell, index) => (
                    <td key={index} className="px-2 py-2 text-netfive-gray-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function StatisticsClient() {
  const { openCustomer } = useCustomerDrawer();
  const [csOwner, setCsOwner] = useState("");

  const { customers: allCustomers } = useCustomerAnalytics({});
  const { customers, isLoading, error } = useCustomerAnalytics({ csOwner: csOwner || undefined });

  const now = useMemo(() => new Date(), []);
  const csOwnerOptions = uniqueCsOwners(allCustomers);

  const kpis = computeStatisticsKpis(customers, now);
  const noContact = getTopNoContactCustomers(customers, now);
  const noVisit = getNoVisitCustomers(customers, now);
  const overdueContacts = getOverdueContacts(customers, now);
  const portfolioByCs = getPortfolioByCsOwner(customers);
  const byCategory = getDistributionByCategory(customers);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-netfive-gray-100">Estatísticas</h1>
        <CsOwnerSelect value={csOwner} onChange={setCsOwner} options={csOwnerOptions} />
      </div>

      {error && <div className="glass-card p-4 text-sm text-netfive-red">{error}</div>}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="glass-card h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Sem contato há mais de 20 dias"
              value={kpis.noContactOver20Days}
              tone={riskCountTone(kpis.noContactOver20Days, customers.length)}
            />
            <KpiCard
              label="Sem nenhum contato registrado"
              value={kpis.neverContacted}
              tone={riskCountTone(kpis.neverContacted, customers.length)}
            />
            <KpiCard
              label="Sem visita nos últimos 60 dias"
              value={kpis.noVisitOver60Days}
              tone={riskCountTone(kpis.noVisitOver60Days, customers.length)}
            />
            <KpiCard
              label="Nunca visitados"
              value={kpis.neverVisited}
              tone={riskCountTone(kpis.neverVisited, customers.length)}
            />
            <KpiCard
              label="Próximos contatos atrasados"
              value={kpis.overdueNextContacts}
              tone={riskCountTone(kpis.overdueNextContacts, customers.length)}
            />
            <KpiCard
              label="Health Score pendente"
              value={kpis.healthPending}
              tone={riskCountTone(kpis.healthPending, customers.length)}
            />
            <KpiCard label="Com plano de expansão" value={kpis.withExpansionPlan} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PanelTable
              title="Clientes sem contato há mais de 20 dias"
              emptyMessage="Nenhum cliente nessa condição."
              headers={["Empresa", "CS", "Último contato", "Dias sem contato"]}
              rows={noContact.map((entry) => ({
                key: entry.customerId,
                onClick: () => openCustomer(entry.customerId),
                cells: [entry.companyName, entry.csOwner, formatDate(entry.lastContact), entry.daysWithoutContact],
              }))}
            />
            <PanelTable
              title="Clientes sem visita nos últimos 60 dias"
              emptyMessage="Nenhum cliente nessa condição."
              headers={["Empresa", "CS", "Dias desde a visita"]}
              rows={noVisit.map((entry) => ({
                key: entry.customerId,
                onClick: () => openCustomer(entry.customerId),
                cells: [entry.companyName, entry.csOwner, entry.daysSinceVisit === null ? "nunca" : entry.daysSinceVisit],
              }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="glass-panel p-4">
              <h2 className="mb-3 text-sm font-semibold text-netfive-gray-100">Carteira por Customer Success</h2>
              <DistributionBarChart data={portfolioByCs} />
            </div>
            <div className="glass-panel p-4">
              <h2 className="mb-3 text-sm font-semibold text-netfive-gray-100">Clientes por categoria</h2>
              <DistributionBarChart data={byCategory} />
            </div>
          </div>

          <PanelTable
            title="Contatos planejados em atraso"
            emptyMessage="Nenhum contato em atraso."
            headers={["Empresa", "CS", "Data prevista", "Dias de atraso"]}
            rows={overdueContacts.map((entry) => ({
              key: entry.customerId,
              onClick: () => openCustomer(entry.customerId),
              cells: [entry.companyName, entry.csOwner, formatDate(entry.nextContact), entry.daysOverdue],
            }))}
          />
        </>
      )}
    </div>
  );
}
