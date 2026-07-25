"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { CloseIcon, ExpandIcon, SyncIcon, TrashIcon } from "@/components/icons";
import { DeleteCustomerModal } from "@/components/customers/DeleteCustomerModal";
import { CustomerOverview } from "@/components/customers/CustomerOverview";
import type { CustomerDetailDTO, ServiceOption } from "@/lib/types";

interface CustomerDrawerProps {
  customer: CustomerDetailDTO;
  services: ServiceOption[];
  currentUserEmail: string;
  onClose: () => void;
  onUpdated: (customer: CustomerDetailDTO) => void;
  onDeleted: () => void;
}

export function CustomerDrawer({
  customer,
  services,
  currentUserEmail,
  onClose,
  onUpdated,
  onDeleted,
}: CustomerDrawerProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function handleResync() {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      await apiFetch(`/api/customers/${customer.id}/resync`, { method: "POST" });
      setSyncMessage("Sincronização disparada com sucesso.");
    } catch (err) {
      setSyncMessage(err instanceof ApiClientError ? err.message : "Falha ao sincronizar.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" role="dialog" aria-modal="true" aria-label={`Ficha de ${customer.companyName}`}>
      <div className="flex h-full w-full max-w-2xl flex-col bg-netfive-bg/95 backdrop-blur-glass shadow-glass">
        <div className="flex items-center justify-between border-b border-netfive-border px-6 py-4">
          <h2 className="text-lg font-semibold text-netfive-gray-100">{customer.companyName}</h2>
          <div className="flex items-center gap-1">
            <Link
              href={`/clientes/${customer.id}`}
              title="Visualização ampla"
              aria-label="Abrir visualização ampla"
              className="rounded p-1.5 text-netfive-gray-500 hover:bg-white/5 hover:text-netfive-gray-100"
            >
              <ExpandIcon className="h-5 w-5" />
            </Link>
            <button type="button" onClick={onClose} aria-label="Fechar ficha" className="rounded p-1.5 text-netfive-gray-500 hover:bg-white/5 hover:text-netfive-gray-100">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <CustomerOverview customer={customer} services={services} currentUserEmail={currentUserEmail} onUpdated={onUpdated} />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-netfive-border px-6 py-4">
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={handleResync} disabled={isSyncing}>
              <SyncIcon className="h-4 w-4" />
              {isSyncing ? "Sincronizando..." : "Sincronizar agora"}
            </button>
            {syncMessage && <span className="text-xs text-netfive-gray-500">{syncMessage}</span>}
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-danger" onClick={() => setShowDeleteModal(true)}>
              <TrashIcon className="h-4 w-4" />
              Excluir cliente
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteCustomerModal
          customerId={customer.id}
          companyName={customer.companyName}
          onCancel={() => setShowDeleteModal(false)}
          onDeleted={() => {
            setShowDeleteModal(false);
            onDeleted();
          }}
        />
      )}
    </div>
  );
}
