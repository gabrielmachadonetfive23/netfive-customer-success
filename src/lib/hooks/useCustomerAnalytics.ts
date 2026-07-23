"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useDataRefresh } from "@/lib/contexts/DataRefreshContext";
import type { CustomerDTO, CustomerFilters } from "@/lib/types";

function buildQuery(filters: CustomerFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.csOwner) params.set("csOwner", filters.csOwner);
  if (filters.category) params.set("category", filters.category);
  if (filters.healthStatus) params.set("healthStatus", filters.healthStatus);
  return params.toString();
}

interface UseCustomerAnalyticsResult {
  customers: CustomerDTO[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/** Busca a lista completa (sem paginação) de clientes que casam com os filtros — para KPIs e gráficos. */
export function useCustomerAnalytics(filters: CustomerFilters): UseCustomerAnalyticsResult {
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const { version } = useDataRefresh();

  const query = buildQuery(filters);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiFetch<CustomerDTO[]>(`/api/customers/analytics${query ? `?${query}` : ""}`)
      .then((data) => {
        if (!cancelled) setCustomers(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar os dados.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, reloadToken, version]);

  return { customers, isLoading, error, reload: () => setReloadToken((t) => t + 1) };
}
