"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerDrawer } from "@/lib/hooks/useCustomerDrawer";
import { useDataRefresh } from "@/lib/contexts/DataRefreshContext";
import { apiFetch } from "@/lib/api-client";
import { CustomerDrawer } from "@/components/customers/CustomerDrawer";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { CloseIcon } from "@/components/icons";
import type { CustomerDetailDTO, ServiceOption } from "@/lib/types";

export function CustomerDrawerHost({ currentUserEmail }: { currentUserEmail: string }) {
  const router = useRouter();
  const { openCustomerId, isCreating, closeCustomer } = useCustomerDrawer();
  const { bump } = useDataRefresh();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [customer, setCustomer] = useState<CustomerDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ServiceOption[]>("/api/services")
      .then(setServices)
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    if (!openCustomerId) {
      setCustomer(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    apiFetch<CustomerDetailDTO>(`/api/customers/${openCustomerId}`)
      .then((data) => {
        if (!cancelled) setCustomer(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Não foi possível carregar o cliente.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [openCustomerId]);

  function handleClose() {
    closeCustomer();
  }

  function refreshAndClose() {
    closeCustomer();
    bump();
    router.refresh();
  }

  if (isCreating) {
    return (
      <div className="fixed inset-0 z-40 flex justify-end bg-black/60" role="dialog" aria-modal="true" aria-label="Novo cliente">
        <div className="flex h-full w-full max-w-2xl flex-col bg-netfive-bg/95 backdrop-blur-glass shadow-glass">
          <div className="flex items-center justify-between border-b border-netfive-border px-6 py-4">
            <h2 className="text-lg font-semibold text-netfive-gray-100">Novo cliente</h2>
            <button type="button" onClick={handleClose} aria-label="Fechar" className="text-netfive-gray-500 hover:text-netfive-gray-100">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <CustomerForm services={services} onCancel={handleClose} onSuccess={refreshAndClose} />
          </div>
        </div>
      </div>
    );
  }

  if (!openCustomerId) return null;

  if (isLoading || !customer) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
        <div className="glass-panel p-6 text-sm text-netfive-gray-300">
          {loadError ?? "Carregando ficha do cliente..."}
        </div>
      </div>
    );
  }

  return (
    <CustomerDrawer
      customer={customer}
      services={services}
      currentUserEmail={currentUserEmail}
      onClose={handleClose}
      onUpdated={(updated) => {
        setCustomer(updated);
        bump();
      }}
      onDeleted={refreshAndClose}
    />
  );
}
