"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useDataRefresh } from "@/lib/contexts/DataRefreshContext";
import { CustomerOverview } from "@/components/customers/CustomerOverview";
import { DeleteCustomerModal } from "@/components/customers/DeleteCustomerModal";
import { TrashIcon } from "@/components/icons";
import type { CustomerDetailDTO, ServiceOption } from "@/lib/types";

export function CustomerFullPageClient({ customerId, currentUserEmail }: { customerId: string; currentUserEmail: string }) {
  const router = useRouter();
  const { bump } = useDataRefresh();
  const [customer, setCustomer] = useState<CustomerDetailDTO | null>(null);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    apiFetch<ServiceOption[]>("/api/services").then(setServices).catch(() => setServices([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiFetch<CustomerDetailDTO>(`/api/customers/${customerId}`)
      .then((data) => {
        if (!cancelled) setCustomer(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar este cliente.");
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (error) {
    return <div className="glass-card p-6 text-sm text-netfive-red">{error}</div>;
  }

  if (!customer) {
    return <div className="h-40 animate-pulse rounded-xl2 bg-netfive-overlay/5" />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/clientes" className="text-xs text-netfive-gray-500 hover:text-netfive-gray-100">
            ← Voltar para Clientes
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-netfive-gray-100">{customer.companyName}</h1>
        </div>
        <button type="button" className="btn-danger" onClick={() => setShowDeleteModal(true)}>
          <TrashIcon className="h-4 w-4" />
          Excluir cliente
        </button>
      </div>

      <div className="glass-panel p-6">
        <CustomerOverview
          customer={customer}
          services={services}
          currentUserEmail={currentUserEmail}
          onUpdated={(updated) => {
            setCustomer(updated);
            bump();
          }}
          columns={3}
        />
      </div>

      {showDeleteModal && (
        <DeleteCustomerModal
          customerId={customer.id}
          companyName={customer.companyName}
          onCancel={() => setShowDeleteModal(false)}
          onDeleted={() => {
            bump();
            router.push("/clientes");
          }}
        />
      )}
    </div>
  );
}
