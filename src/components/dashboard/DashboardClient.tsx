"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useCustomerAnalytics } from "@/lib/hooks/useCustomerAnalytics";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useCustomerDrawer } from "@/lib/hooks/useCustomerDrawer";
import { useDataRefresh } from "@/lib/contexts/DataRefreshContext";
import { computeDashboardKpis } from "@/lib/services/dashboard-analytics";
import { KpiCard } from "@/components/ui/KpiCard";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { Pagination } from "@/components/ui/Pagination";
import { TableEmptyState, TableErrorState, TableSkeleton } from "@/components/ui/TableStates";
import {
  CategorySelect,
  CsOwnerSelect,
  HealthStatusSelect,
  SearchInput,
  uniqueCsOwners,
} from "@/components/filters/FilterControls";
import { PlusIcon } from "@/components/icons";
import { IntegrationsStatusCard } from "@/components/integrations/IntegrationsStatusCard";
import { formatDate } from "@/lib/format";
import type { CustomerDTO, PaginatedResult } from "@/lib/types";
import type { Category, HealthStatus } from "@/lib/constants";

type SortColumn = "companyName" | "csOwner" | "category" | "healthScore" | "lastContact" | "nextContact";

const PAGE_SIZE = 10;

export function DashboardClient() {
  const { openCustomer, openCreateCustomer } = useCustomerDrawer();
  const { version } = useDataRefresh();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [csOwner, setCsOwner] = useState("");
  const [category, setCategory] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [kpiFollowsFilters, setKpiFollowsFilters] = useState(false);

  const [sortBy, setSortBy] = useState<SortColumn>("companyName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filters = {
    search: search || undefined,
    csOwner: csOwner || undefined,
    category: (category || undefined) as Category | undefined,
    healthStatus: (healthStatus || undefined) as HealthStatus | undefined,
  };

  const { customers: allCustomers } = useCustomerAnalytics({});
  const { customers: filteredCustomers } = useCustomerAnalytics(filters);

  const kpiSource = kpiFollowsFilters ? filteredCustomers : allCustomers;
  const kpis = computeDashboardKpis(kpiSource, new Date());
  const csOwnerOptions = uniqueCsOwners(allCustomers);

  const [tableResult, setTableResult] = useState<PaginatedResult<CustomerDTO> | null>(null);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => setPage(1), [search, csOwner, category, healthStatus]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingTable(true);
    setTableError(null);

    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.csOwner) params.set("csOwner", filters.csOwner);
    if (filters.category) params.set("category", filters.category);
    if (filters.healthStatus) params.set("healthStatus", filters.healthStatus);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

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
  }, [search, csOwner, category, healthStatus, sortBy, sortDir, page, reloadToken, version]);

  function toggleSort(column: SortColumn) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  }

  const columns: { key: SortColumn; label: string }[] = [
    { key: "companyName", label: "Empresa" },
    { key: "csOwner", label: "CS responsável" },
    { key: "category", label: "Categoria" },
    { key: "healthScore", label: "Health Score" },
    { key: "lastContact", label: "Último contato" },
    { key: "nextContact", label: "Próximo contato" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-netfive-gray-100">Visão geral</h1>
        <button type="button" className="btn-primary" onClick={openCreateCustomer}>
          <PlusIcon className="h-4 w-4" />
          Novo cliente
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Buscar empresa ou serviço..." />
        <CsOwnerSelect value={csOwner} onChange={setCsOwner} options={csOwnerOptions} />
        <CategorySelect value={category} onChange={setCategory} />
        <HealthStatusSelect value={healthStatus} onChange={setHealthStatus} />
        <label className="ml-auto flex items-center gap-2 text-xs text-netfive-gray-500">
          <input
            type="checkbox"
            checked={kpiFollowsFilters}
            onChange={(event) => setKpiFollowsFilters(event.target.checked)}
            className="h-4 w-4 rounded border-netfive-border bg-transparent text-netfive-red"
          />
          KPIs acompanham os filtros
        </label>
      </div>
      {!kpiFollowsFilters && (
        <p className="-mt-2 text-xs text-netfive-gray-700">
          Os indicadores abaixo representam toda a carteira. Os filtros afetam apenas a tabela.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Clientes na base" value={kpis.totalCustomers} />
        <KpiCard label="Health avaliado" value={kpis.healthEvaluated} />
        <KpiCard label="Planos de expansão" value={kpis.expansionPlans} />
        <KpiCard label="Próximos contatos" value={kpis.upcomingContacts} />
        <IntegrationsStatusCard />
      </div>

      <div className="glass-panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <SortableHeader
                  key={col.key}
                  label={col.label}
                  active={sortBy === col.key}
                  direction={sortDir}
                  onClick={() => toggleSort(col.key)}
                />
              ))}
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">
                Serviços
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">
                Plano de ação
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">
                Estimativa de crescimento
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-netfive-gray-500">
                Ação
              </th>
            </tr>
          </thead>

          {isLoadingTable && <TableSkeleton columns={columns.length + 4} />}
          {!isLoadingTable && tableError && (
            <TableErrorState colSpan={columns.length + 4} message={tableError} onRetry={() => setReloadToken((t) => t + 1)} />
          )}
          {!isLoadingTable && !tableError && tableResult?.items.length === 0 && (
            <TableEmptyState colSpan={columns.length + 4} message="Nenhum cliente encontrado com os filtros atuais." />
          )}
          {!isLoadingTable && !tableError && tableResult && tableResult.items.length > 0 && (
            <tbody>
              {tableResult.items.map((customer) => (
                <tr key={customer.id} className="border-t border-netfive-border hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-netfive-gray-100">{customer.companyName}</td>
                  <td className="px-4 py-3 text-netfive-gray-300">{customer.csOwner}</td>
                  <td className="px-4 py-3 text-netfive-gray-300">{customer.category}</td>
                  <td className="px-4 py-3 text-netfive-gray-300">
                    {customer.healthScore !== null ? `${customer.healthScore} · ${customer.healthStatus}` : customer.healthStatus}
                  </td>
                  <td className="px-4 py-3 text-netfive-gray-300">{formatDate(customer.lastContact)}</td>
                  <td className="px-4 py-3 text-netfive-gray-300">{formatDate(customer.nextContact)}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-netfive-gray-300" title={customer.services.map((s) => s.name).join(", ")}>
                    {customer.services.length > 0 ? customer.services.map((s) => s.name).join(", ") : "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-netfive-gray-300" title={customer.actionPlan ?? undefined}>
                    {customer.actionPlan ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-netfive-gray-300">{customer.growthEstimate ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => openCustomer(customer.id)}>
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>

        {tableResult && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={tableResult.total} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
