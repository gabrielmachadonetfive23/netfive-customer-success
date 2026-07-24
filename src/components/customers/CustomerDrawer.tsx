"use client";

import { useState } from "react";
import { formatCurrencyBRL, formatDate } from "@/lib/format";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { CloseIcon, ExternalLinkIcon, SyncIcon, TrashIcon } from "@/components/icons";
import { HealthScoreBar } from "@/components/customers/HealthScoreBar";
import { ObservationsTimeline } from "@/components/customers/ObservationsTimeline";
import { PipedriveDealsSection } from "@/components/customers/PipedriveDealsSection";
import { DeleteCustomerModal } from "@/components/customers/DeleteCustomerModal";
import { CustomerForm } from "@/components/customers/CustomerForm";
import type { CustomerDetailDTO, ServiceOption } from "@/lib/types";

interface CustomerDrawerProps {
  customer: CustomerDetailDTO;
  services: ServiceOption[];
  currentUserEmail: string;
  onClose: () => void;
  onUpdated: (customer: CustomerDetailDTO) => void;
  onDeleted: () => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-netfive-gray-500">{label}</dt>
      <dd className="text-sm text-netfive-gray-100">{value ?? "—"}</dd>
    </div>
  );
}

export function CustomerDrawer({
  customer,
  services,
  currentUserEmail,
  onClose,
  onUpdated,
  onDeleted,
}: CustomerDrawerProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
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
          <h2 className="text-lg font-semibold text-netfive-gray-100">
            {mode === "edit" ? `Editar ${customer.companyName}` : customer.companyName}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar ficha" className="text-netfive-gray-500 hover:text-netfive-gray-100">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === "edit" ? (
            <CustomerForm
              services={services}
              customer={customer}
              onCancel={() => setMode("view")}
              onSuccess={(updated) => {
                setMode("view");
                onUpdated(updated);
              }}
            />
          ) : (
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Identificação</h3>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="CS responsável" value={customer.csOwner} />
                  <Field label="Categoria" value={customer.category} />
                  <Field label="Segmento" value={customer.segment} />
                  <Field label="Contato principal" value={customer.contactName} />
                  <Field label="Cargo" value={customer.contactRole} />
                  <Field label="Telefone/e-mail" value={customer.contactInfo} />
                  <Field label="Responsável técnico" value={customer.technicalOwner} />
                  <Field label="Início do cliente" value={formatDate(customer.startDate)} />
                  <Field label="Renovação" value={formatDate(customer.renewalDate)} />
                  <Field label="Faturamento" value={formatCurrencyBRL(customer.annualRevenue)} />
                  <Field label="Ano fiscal" value={customer.fiscalYear} />
                  <Field label="Métrica" value={customer.revenueMetric} />
                  <Field label="Período" value={customer.revenuePeriod} />
                </dl>
                <div className="mt-3">
                  <dt className="mb-1 text-xs text-netfive-gray-500">Serviços</dt>
                  <div className="flex flex-wrap gap-1.5">
                    {customer.services.length === 0 && <span className="text-sm text-netfive-gray-500">—</span>}
                    {customer.services.map((service) => (
                      <span key={service.id} className="rounded-full border border-netfive-border bg-white/5 px-2.5 py-1 text-xs text-netfive-gray-200">
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {(customer.segmentSourceTitle || customer.revenueSourceTitle) && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Evidências públicas</h3>
                  <div className="space-y-3">
                    {customer.segmentSourceTitle && (
                      <div className="glass-card p-3 text-sm">
                        <p className="text-netfive-gray-100">{customer.segmentSourceTitle}</p>
                        <p className="text-xs text-netfive-gray-500">Verificado em {formatDate(customer.segmentVerifiedAt)}</p>
                        {customer.segmentSourceUrl && (
                          <a
                            href={customer.segmentSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-netfive-red hover:underline"
                          >
                            Abrir fonte <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                    {customer.revenueSourceTitle && (
                      <div className="glass-card p-3 text-sm">
                        <p className="text-netfive-gray-100">{customer.revenueSourceTitle}</p>
                        <p className="text-xs text-netfive-gray-500">
                          {customer.revenueMetric} · {customer.revenuePeriod} · Verificado em {formatDate(customer.revenueVerifiedAt)}
                        </p>
                        {customer.revenueSourceUrl && (
                          <a
                            href={customer.revenueSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-netfive-red hover:underline"
                          >
                            Abrir fonte <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Acompanhamento</h3>
                <HealthScoreBar score={customer.healthScore} status={customer.healthStatus} />
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="Motivo" value={customer.healthReason} />
                  <Field label="Pontos de atenção" value={customer.attentionPoints} />
                  <Field label="Plano de ação" value={customer.actionPlan} />
                  <Field label="Último contato" value={formatDate(customer.lastContact)} />
                  <Field label="Próximo contato" value={formatDate(customer.nextContact)} />
                  <Field label="Última visita" value={formatDate(customer.lastVisit)} />
                  <Field label="Próxima visita" value={formatDate(customer.nextVisit)} />
                </dl>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Relacionamento e crescimento</h3>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Necessidades" value={customer.needs} />
                  <Field label="Percepção atual" value={customer.currentPerception} />
                  <Field label="Plano de expansão" value={customer.expansionPlan} />
                  <Field label="Oportunidades" value={customer.opportunities} />
                  <Field label="Próximo passo" value={customer.expansionNextStep} />
                  <Field label="Estimativa de crescimento" value={customer.growthEstimate} />
                </dl>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Negócios (Pipedrive)</h3>
                <PipedriveDealsSection customerId={customer.id} />
              </section>

              <section>
                <ObservationsTimeline
                  customerId={customer.id}
                  observations={customer.observations}
                  defaultAuthor={currentUserEmail}
                  onAdded={(observation) =>
                    onUpdated({ ...customer, observations: [observation, ...customer.observations] })
                  }
                />
              </section>
            </div>
          )}
        </div>

        {mode === "view" && (
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
              <button type="button" className="btn-secondary" onClick={() => setMode("edit")}>
                Editar
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
        )}
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
