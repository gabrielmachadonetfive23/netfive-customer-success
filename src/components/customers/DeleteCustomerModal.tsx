"use client";

import { useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";

interface DeleteCustomerModalProps {
  customerId: string;
  companyName: string;
  onDeleted: () => void;
  onCancel: () => void;
}

export function DeleteCustomerModal({ customerId, companyName, onDeleted, onCancel }: DeleteCustomerModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = confirmation.trim() === companyName && !isDeleting;

  async function handleDelete() {
    if (!canConfirm) return;
    setIsDeleting(true);
    setError(null);
    try {
      await apiFetch(`/api/customers/${customerId}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Não foi possível excluir o cliente.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div className="glass-panel w-full max-w-md p-6">
        <h2 id="delete-modal-title" className="mb-2 text-base font-semibold text-netfive-gray-100">
          Excluir cliente
        </h2>
        <p className="mb-4 text-sm text-netfive-gray-300">
          Esta ação removerá permanentemente o cadastro e todo o histórico de observações de{" "}
          <strong>{companyName}</strong>. Esta operação não pode ser desfeita.
        </p>

        <label className="field-label" htmlFor="delete-confirmation">
          Digite <strong>{companyName}</strong> para confirmar
        </label>
        <input
          id="delete-confirmation"
          className="input-field mb-2"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={isDeleting}
          autoComplete="off"
        />
        {error && <p className="field-error mb-2">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button type="button" className="btn-danger" onClick={handleDelete} disabled={!canConfirm}>
            {isDeleting ? "Excluindo..." : "Excluir cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}
