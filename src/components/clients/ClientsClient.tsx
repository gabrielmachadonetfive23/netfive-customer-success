"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useCustomerAnalytics } from "@/lib/hooks/useCustomerAnalytics";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useCustomerDrawer } from "@/lib/hooks/useCustomerDrawer";
import { useDataRefresh } from "@/lib/contexts/DataRefreshContext";
import {
  computeClientsKpis,
  computeFinancialBarData,
  computeSegmentDistribution,
} from "@/lib/services/clients-analytics";
import { coveragePercentTone } from "@/lib/kpi-tone";
import { KpiCard } from "@/components/ui/KpiCard";
import { HEALTH_STATUS_TEXT_COLOR } from "@/components/customers/HealthScoreBar";
import { Pagination } from "@/components/ui/Pagination";
import { TableEmptyState, TableErrorState, TableSkeleton } from "@/components/ui/TableStates";
import { CsOwnerSelect, SearchInput, uniqueCsOwners } from "@/components/filters/FilterControls";
import { SegmentBarChart } from "@/components/clients/SegmentBarChart";
import { FinancialBarChart } from "@/components/clients/FinancialBarChart";
import { PlusIcon } from "@/components/icons";
import { formatCurrencyBRL, formatPercent } from "@/lib/format";
import type { CustomerDTO, PaginatedResult } from "@/lib/types";

export function ClientsClient() {
  const { openCustomer, openCreateCustomer } = useCustomerDrawer();
  const { version } = useDataRefresh();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [csOwner, setCsOwner] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filters = { search: search || undefined, csOwner: csOwner || undefined };

  const { customers: allCustomers } = useCustomerAnalytics({});
  const { customers: filteredCustomers } = useCustomerAnalytics(filters);

  const now = useMemo(() => new Date(), []);
  const kpis = computeClientsKpis(filteredCustomers, now);
  const segments = computeSegmentDistribution(filteredCustomers);
  const financialData = computeFinancialBarData(filteredCustomers, now);
  const csOwnerOptions = uniqueCsOwners(allCustomers);

  const [tableResult, setTableResult] = useState<PaginatedResult<CustomerDTO> | null>(null);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => setPage(1), [search, csOwner, pageSize]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingTable(true);
    setTableError(null);

    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.csOwner) params.set("csOwner", filters.csOwner);
    params.set("sortBy", "companyName");
    params.set("sortDir", "asc");
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    apiFetch<PaginatedResult<CustomerDTO>>(`/api/customers?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setTableResult(data);
      })
      .catch(() => {
        if (!cancelled) setTableError("Não foi possível carregar os clientes.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTable(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, csOwner, pageSize, page, reloadToken, version]);

  const columnCount = 8;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-netfive-gray-100">Visão geral de clientes</h1>
        <button type="button" className="btn-primary" onClick={openCreateCustomer}>
          <PlusIcon className="h-4 w-4" />
          Novo cliente
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Buscar empresa, serviço ou segmento..." />
        <CsOwnerSelect value={csOwner} onChange={setCsOwner} options={csOwnerOptions} />
        <label className="flex items-center gap-2 text-xs text-netfive-gray-500">
          Clientes por página
          <select className="input-field w-auto" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total de clientes" value={kpis.totalCustomers} />
        <KpiCard
          label="Com segmento informado"
          value={kpis.withSegment}
          hint={formatPercent(kpis.withSegmentPercent)}
          tone={coveragePercentTone(kpis.withSegmentPercent, kpis.totalCustomers)}
        />
        <KpiCard label={`Receita pública divulgada (FY${kpis.fiscalYear})`} value={formatCurrencyBRL(kpis.totalPublicRevenue)} />
        <KpiCard label="Clientes com faturamento verificado" value={kpis.verifiedRevenueCount} />
        <KpiCard
          label="Média entre clientes divulgados"
          value={kpis.averageDisclosedRevenue !== null ? formatCurrencyBRL(kpis.averageDisclosedRevenue) : "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-panel p-4">
          <h2 className="mb-2 text-sm font-semibold text-netfive-gray-100">Clientes por segmento</h2>
          <SegmentBarChart data={segments} />
        </div>
        <div className="glass-panel p-4">
          <h2 className="mb-2 text-sm font-semibold text-netfive-gray-100">
            Faturamento por cliente (FY{kpis.fiscalYear})
          </h2>
          <FinancialBarChart data={financialData} onSelect={openCustomer} />
        </div>
      </div>

      <div className="glass-panel overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr>
              {["Empresa", "Customer Success", "Categoria", "Segmento", "Serviços", "Health Score", `Faturamento FY${kpis.fiscalYear}`, "Ação"].map(
                (label) => (
                  <th key={label} scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>

          {isLoadingTable && <TableSkeleton columns={columnCount} />}
          {!isLoadingTable && tableError && (
            <TableErrorState colSpan={columnCount} message={tableError} onRetry={() => setReloadToken((t) => t + 1)} />
          )}
          {!isLoadingTable && !tableError && tableResult?.items.length === 0 && (
            <TableEmptyState colSpan={columnCount} message="Nenhum cliente encontrado com os filtros atuais." />
          )}
          {!isLoadingTable && !tableError && tableResult && tableResult.items.length > 0 && (
            <tbody>
              {tableResult.items.map((customer) => {
                const isCurrentFiscalYear = customer.fiscalYear === kpis.fiscalYear && (customer.annualRevenue ?? 0) > 0;
                return (
                  <tr
                    key={customer.id}
                    className="cursor-pointer border-t border-netfive-border transition-colors hover:bg-netfive-red/[0.06]"
                    tabIndex={0}
                    onClick={() => openCustomer(customer.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") openCustomer(customer.id);
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-netfive-gray-100">{customer.companyName}</td>
                    <td className="px-4 py-3 text-netfive-gray-300">{customer.csOwner}</td>
                    <td className="px-4 py-3 text-netfive-gray-300">{customer.category}</td>
                    <td className="px-4 py-3 text-netfive-gray-300">{customer.segment ?? "Não informado"}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-netfive-gray-300">
                      {customer.services.map((s) => s.name).join(", ") || "—"}
                    </td>
                    <td className={`px-4 py-3 font-medium ${customer.healthScore !== null ? HEALTH_STATUS_TEXT_COLOR[customer.healthStatus] : "text-netfive-gray-300"}`}>
                      {customer.healthScore ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-netfive-gray-300">
                      {isCurrentFiscalYear ? formatCurrencyBRL(customer.annualRevenue) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="btn-secondary px-3 py-1.5"
                        onClick={(event) => {
                          event.stopPropagation();
                          openCustomer(customer.id);
                        }}
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>

        {tableResult && <Pagination page={page} pageSize={pageSize} total={tableResult.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}
