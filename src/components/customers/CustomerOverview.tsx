"use client";

import { ALLOWED_CATEGORIES, HEALTH_STATUSES } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { customerToApiPayload } from "@/lib/customer-payload";
import { ExternalLinkIcon } from "@/components/icons";
import { HealthScoreBar } from "@/components/customers/HealthScoreBar";
import { EditableField } from "@/components/customers/EditableField";
import { EditableServices } from "@/components/customers/EditableServices";
import { ObservationsTimeline } from "@/components/customers/ObservationsTimeline";
import { PipedriveDealsSection } from "@/components/customers/PipedriveDealsSection";
import { formatDate } from "@/lib/format";
import type { CustomerDetailDTO, ServiceOption } from "@/lib/types";

const CATEGORY_OPTIONS = ALLOWED_CATEGORIES.map((c) => ({ value: c, label: c }));
const HEALTH_STATUS_OPTIONS = HEALTH_STATUSES.map((s) => ({ value: s, label: s }));

interface CustomerOverviewProps {
  customer: CustomerDetailDTO;
  services: ServiceOption[];
  currentUserEmail: string;
  onUpdated: (customer: CustomerDetailDTO) => void;
  /** Colunas do grid de campos — 2 no drawer estreito, 3 na visualização ampla. */
  columns?: 2 | 3;
}

/**
 * Ficha completa do cliente com edição direta nos campos (clique para editar,
 * salva ao sair do campo — sem precisar de um botão "Editar" separado).
 * Compartilhado entre o drawer lateral e a página de visualização ampla.
 */
export function CustomerOverview({ customer, services, currentUserEmail, onUpdated, columns = 2 }: CustomerOverviewProps) {
  async function saveField<K extends keyof ReturnType<typeof customerToApiPayload>>(
    key: K,
    value: ReturnType<typeof customerToApiPayload>[K],
  ): Promise<void> {
    const payload = { ...customerToApiPayload(customer), [key]: value };
    const updated = await apiFetch<CustomerDetailDTO>(`/api/customers/${customer.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    onUpdated(updated);
  }

  async function saveServiceIds(serviceIds: string[]): Promise<void> {
    const payload = { ...customerToApiPayload(customer), serviceIds };
    const updated = await apiFetch<CustomerDetailDTO>(`/api/customers/${customer.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    onUpdated(updated);
  }

  const gridCols = columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2";

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Identificação</h3>
        <dl className={`grid gap-3 ${gridCols}`}>
          <EditableField label="CS responsável" value={customer.csOwner} onSave={(v) => saveField("csOwner", String(v ?? ""))} />
          <EditableField
            label="Categoria"
            kind="select"
            options={CATEGORY_OPTIONS}
            value={customer.category}
            onSave={(v) => saveField("category", String(v))}
          />
          <EditableField label="Segmento" value={customer.segment} onSave={(v) => saveField("segment", v as string | undefined)} />
          <EditableField label="Contato principal" value={customer.contactName} onSave={(v) => saveField("contactName", v as string | undefined)} />
          <EditableField label="Cargo" value={customer.contactRole} onSave={(v) => saveField("contactRole", v as string | undefined)} />
          <EditableField label="Telefone/e-mail" value={customer.contactInfo} onSave={(v) => saveField("contactInfo", v as string | undefined)} />
          <EditableField label="Responsável técnico" value={customer.technicalOwner} onSave={(v) => saveField("technicalOwner", v as string | undefined)} />
          <EditableField label="Início do cliente" kind="date" value={customer.startDate} onSave={(v) => saveField("startDate", v as string | undefined)} />
          <EditableField label="Renovação" kind="date" value={customer.renewalDate} onSave={(v) => saveField("renewalDate", v as string | undefined)} />
          <EditableField label="Faturamento" kind="number" value={customer.annualRevenue} onSave={(v) => saveField("annualRevenue", v as number | null)} />
          <EditableField label="Ano fiscal" kind="number" value={customer.fiscalYear} onSave={(v) => saveField("fiscalYear", v as number | null)} />
          <EditableField label="Métrica" value={customer.revenueMetric} onSave={(v) => saveField("revenueMetric", v as string | undefined)} />
          <EditableField label="Período" value={customer.revenuePeriod} onSave={(v) => saveField("revenuePeriod", v as string | undefined)} />
        </dl>
        <div className="mt-3">
          <EditableServices services={services} selectedIds={customer.services.map((s) => s.id)} onSave={saveServiceIds} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Evidências públicas</h3>
        <div className="space-y-3">
          <div className="glass-card space-y-2 p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-netfive-gray-500">Fonte do segmento</p>
            <dl className={`grid gap-3 ${gridCols}`}>
              <EditableField label="Título da fonte" value={customer.segmentSourceTitle} onSave={(v) => saveField("segmentSourceTitle", v as string | undefined)} />
              <EditableField label="URL da fonte" kind="url" value={customer.segmentSourceUrl} onSave={(v) => saveField("segmentSourceUrl", v as string | undefined)} />
              <EditableField label="Verificado em" kind="date" value={customer.segmentVerifiedAt} onSave={(v) => saveField("segmentVerifiedAt", v as string | undefined)} />
            </dl>
            {customer.segmentSourceUrl && (
              <a href={customer.segmentSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-netfive-red hover:underline">
                Abrir fonte <ExternalLinkIcon className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="glass-card space-y-2 p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-netfive-gray-500">Fonte financeira</p>
            <dl className={`grid gap-3 ${gridCols}`}>
              <EditableField label="Título da fonte" value={customer.revenueSourceTitle} onSave={(v) => saveField("revenueSourceTitle", v as string | undefined)} />
              <EditableField label="URL da fonte" kind="url" value={customer.revenueSourceUrl} onSave={(v) => saveField("revenueSourceUrl", v as string | undefined)} />
              <EditableField label="Verificado em" kind="date" value={customer.revenueVerifiedAt} onSave={(v) => saveField("revenueVerifiedAt", v as string | undefined)} />
            </dl>
            {customer.revenueSourceUrl && (
              <a href={customer.revenueSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-netfive-red hover:underline">
                Abrir fonte <ExternalLinkIcon className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Acompanhamento</h3>
        <HealthScoreBar score={customer.healthScore} status={customer.healthStatus} />
        <dl className={`mt-3 grid gap-3 ${gridCols}`}>
          <EditableField label="Health Score (0-100)" kind="number" value={customer.healthScore} onSave={(v) => saveField("healthScore", v as number | null)} />
          <EditableField
            label="Status de saúde"
            kind="select"
            options={HEALTH_STATUS_OPTIONS}
            value={customer.healthStatus}
            onSave={(v) => saveField("healthStatus", String(v))}
          />
          <EditableField label="Motivo" value={customer.healthReason} onSave={(v) => saveField("healthReason", v as string | undefined)} />
          <EditableField label="Pontos de atenção" value={customer.attentionPoints} onSave={(v) => saveField("attentionPoints", v as string | undefined)} />
          <EditableField label="Plano de ação" kind="textarea" value={customer.actionPlan} onSave={(v) => saveField("actionPlan", v as string | undefined)} />
          <EditableField label="Último contato" kind="date" value={customer.lastContact} onSave={(v) => saveField("lastContact", v as string | undefined)} />
          <EditableField label="Próximo contato" kind="date" value={customer.nextContact} onSave={(v) => saveField("nextContact", v as string | undefined)} />
          <EditableField label="Última visita" kind="date" value={customer.lastVisit} onSave={(v) => saveField("lastVisit", v as string | undefined)} />
          <EditableField label="Próxima visita" kind="date" value={customer.nextVisit} onSave={(v) => saveField("nextVisit", v as string | undefined)} />
        </dl>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-netfive-gray-100">Relacionamento e crescimento</h3>
        <dl className={`grid gap-3 ${gridCols}`}>
          <EditableField label="Necessidades" kind="textarea" value={customer.needs} onSave={(v) => saveField("needs", v as string | undefined)} />
          <EditableField label="Percepção atual" kind="textarea" value={customer.currentPerception} onSave={(v) => saveField("currentPerception", v as string | undefined)} />
          <EditableField label="Plano de expansão" kind="textarea" value={customer.expansionPlan} onSave={(v) => saveField("expansionPlan", v as string | undefined)} />
          <EditableField label="Oportunidades" kind="textarea" value={customer.opportunities} onSave={(v) => saveField("opportunities", v as string | undefined)} />
          <EditableField label="Próximo passo" value={customer.expansionNextStep} onSave={(v) => saveField("expansionNextStep", v as string | undefined)} />
          <EditableField label="Estimativa de crescimento" value={customer.growthEstimate} onSave={(v) => saveField("growthEstimate", v as string | undefined)} />
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
          onAdded={(observation) => onUpdated({ ...customer, observations: [observation, ...customer.observations] })}
        />
      </section>

      <p className="text-xs text-netfive-gray-700">Última atualização: {formatDate(customer.updatedAt)}</p>
    </div>
  );
}
