"use client";

import { useState } from "react";
import { ALLOWED_CATEGORIES, HEALTH_STATUSES } from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { ServiceMultiSelect } from "@/components/customers/ServiceMultiSelect";
import type { CustomerDetailDTO, ServiceOption } from "@/lib/types";

interface FormState {
  companyName: string;
  csOwner: string;
  category: string;
  segment: string;
  segmentSourceTitle: string;
  segmentSourceUrl: string;
  segmentVerifiedAt: string;
  contactName: string;
  contactRole: string;
  contactInfo: string;
  technicalOwner: string;
  startDate: string;
  renewalDate: string;
  healthScore: string;
  healthStatus: string;
  healthReason: string;
  attentionPoints: string;
  actionPlan: string;
  lastContact: string;
  nextContact: string;
  lastVisit: string;
  nextVisit: string;
  needs: string;
  currentPerception: string;
  expansionPlan: string;
  growthEstimate: string;
  opportunities: string;
  expansionNextStep: string;
  annualRevenue: string;
  fiscalYear: string;
  revenueMetric: string;
  revenuePeriod: string;
  revenueSourceTitle: string;
  revenueSourceUrl: string;
  revenueVerifiedAt: string;
}

function buildInitialState(customer?: CustomerDetailDTO): FormState {
  return {
    companyName: customer?.companyName ?? "",
    csOwner: customer?.csOwner ?? "",
    category: customer?.category ?? "AA",
    segment: customer?.segment ?? "",
    segmentSourceTitle: customer?.segmentSourceTitle ?? "",
    segmentSourceUrl: customer?.segmentSourceUrl ?? "",
    segmentVerifiedAt: toDateInputValue(customer?.segmentVerifiedAt),
    contactName: customer?.contactName ?? "",
    contactRole: customer?.contactRole ?? "",
    contactInfo: customer?.contactInfo ?? "",
    technicalOwner: customer?.technicalOwner ?? "",
    startDate: toDateInputValue(customer?.startDate),
    renewalDate: toDateInputValue(customer?.renewalDate),
    healthScore: customer?.healthScore?.toString() ?? "",
    healthStatus: customer?.healthStatus ?? "Não avaliado",
    healthReason: customer?.healthReason ?? "",
    attentionPoints: customer?.attentionPoints ?? "",
    actionPlan: customer?.actionPlan ?? "",
    lastContact: toDateInputValue(customer?.lastContact),
    nextContact: toDateInputValue(customer?.nextContact),
    lastVisit: toDateInputValue(customer?.lastVisit),
    nextVisit: toDateInputValue(customer?.nextVisit),
    needs: customer?.needs ?? "",
    currentPerception: customer?.currentPerception ?? "",
    expansionPlan: customer?.expansionPlan ?? "",
    growthEstimate: customer?.growthEstimate ?? "",
    opportunities: customer?.opportunities ?? "",
    expansionNextStep: customer?.expansionNextStep ?? "",
    annualRevenue: customer?.annualRevenue?.toString() ?? "",
    fiscalYear: customer?.fiscalYear?.toString() ?? "",
    revenueMetric: customer?.revenueMetric ?? "",
    revenuePeriod: customer?.revenuePeriod ?? "",
    revenueSourceTitle: customer?.revenueSourceTitle ?? "",
    revenueSourceUrl: customer?.revenueSourceUrl ?? "",
    revenueVerifiedAt: toDateInputValue(customer?.revenueVerifiedAt),
  };
}

interface CustomerFormProps {
  services: ServiceOption[];
  customer?: CustomerDetailDTO;
  onSuccess: (customer: CustomerDetailDTO) => void;
  onCancel: () => void;
}

export function CustomerForm({ services, customer, onSuccess, onCancel }: CustomerFormProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(customer));
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    () => customer?.services.map((s) => s.id) ?? [],
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function fieldError(key: string): string | undefined {
    return fieldErrors[key]?.[0];
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload = {
      companyName: form.companyName,
      csOwner: form.csOwner,
      category: form.category,
      segment: form.segment || undefined,
      segmentSourceTitle: form.segmentSourceTitle || undefined,
      segmentSourceUrl: form.segmentSourceUrl || undefined,
      segmentVerifiedAt: form.segmentVerifiedAt || undefined,
      contactName: form.contactName || undefined,
      contactRole: form.contactRole || undefined,
      contactInfo: form.contactInfo || undefined,
      technicalOwner: form.technicalOwner || undefined,
      startDate: form.startDate || undefined,
      renewalDate: form.renewalDate || undefined,
      healthScore: form.healthScore === "" ? null : Number(form.healthScore),
      healthStatus: form.healthStatus,
      healthReason: form.healthReason || undefined,
      attentionPoints: form.attentionPoints || undefined,
      actionPlan: form.actionPlan || undefined,
      lastContact: form.lastContact || undefined,
      nextContact: form.nextContact || undefined,
      lastVisit: form.lastVisit || undefined,
      nextVisit: form.nextVisit || undefined,
      needs: form.needs || undefined,
      currentPerception: form.currentPerception || undefined,
      expansionPlan: form.expansionPlan || undefined,
      growthEstimate: form.growthEstimate || undefined,
      opportunities: form.opportunities || undefined,
      expansionNextStep: form.expansionNextStep || undefined,
      annualRevenue: form.annualRevenue === "" ? null : Number(form.annualRevenue),
      fiscalYear: form.fiscalYear === "" ? null : Number(form.fiscalYear),
      revenueMetric: form.revenueMetric || undefined,
      revenuePeriod: form.revenuePeriod || undefined,
      revenueSourceTitle: form.revenueSourceTitle || undefined,
      revenueSourceUrl: form.revenueSourceUrl || undefined,
      revenueVerifiedAt: form.revenueVerifiedAt || undefined,
      serviceIds: selectedServiceIds,
    };

    try {
      const result = customer
        ? await apiFetch<CustomerDetailDTO>(`/api/customers/${customer.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiFetch<CustomerDetailDTO>("/api/customers", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      onSuccess(result);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
        const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
        if (details?.fieldErrors) setFieldErrors(details.fieldErrors);
      } else {
        setFormError("Não foi possível salvar o cliente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-1 pb-4">
        {formError && (
          <div role="alert" className="rounded-lg border border-netfive-red/40 bg-netfive-red/10 px-3 py-2 text-sm text-netfive-red">
            {formError}
          </div>
        )}

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-semibold text-netfive-gray-100">Identificação</legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="companyName">Empresa *</label>
              <input id="companyName" className="input-field" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} required />
              {fieldError("companyName") && <p className="field-error">{fieldError("companyName")}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="csOwner">CS responsável *</label>
              <input id="csOwner" className="input-field" value={form.csOwner} onChange={(e) => set("csOwner", e.target.value)} required />
              {fieldError("csOwner") && <p className="field-error">{fieldError("csOwner")}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="category">Categoria *</label>
              <select id="category" className="input-field" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {ALLOWED_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="segment">Segmento</label>
              <input id="segment" className="input-field" value={form.segment} onChange={(e) => set("segment", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="segmentSourceTitle">Fonte do segmento</label>
              <input id="segmentSourceTitle" className="input-field" value={form.segmentSourceTitle} onChange={(e) => set("segmentSourceTitle", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="segmentSourceUrl">URL da fonte do segmento</label>
              <input id="segmentSourceUrl" type="url" className="input-field" value={form.segmentSourceUrl} onChange={(e) => set("segmentSourceUrl", e.target.value)} placeholder="https://" />
              {fieldError("segmentSourceUrl") && <p className="field-error">{fieldError("segmentSourceUrl")}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="segmentVerifiedAt">Segmento verificado em</label>
              <input id="segmentVerifiedAt" type="date" className="input-field" value={form.segmentVerifiedAt} onChange={(e) => set("segmentVerifiedAt", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="contactName">Contato principal</label>
              <input id="contactName" className="input-field" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="contactRole">Cargo do contato</label>
              <input id="contactRole" className="input-field" value={form.contactRole} onChange={(e) => set("contactRole", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="contactInfo">Telefone/e-mail do contato</label>
              <input id="contactInfo" className="input-field" value={form.contactInfo} onChange={(e) => set("contactInfo", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="technicalOwner">Responsável técnico</label>
              <input id="technicalOwner" className="input-field" value={form.technicalOwner} onChange={(e) => set("technicalOwner", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="startDate">Início do cliente</label>
              <input id="startDate" type="date" className="input-field" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="renewalDate">Renovação</label>
              <input id="renewalDate" type="date" className="input-field" value={form.renewalDate} onChange={(e) => set("renewalDate", e.target.value)} />
            </div>
          </div>
          <ServiceMultiSelect services={services} selectedIds={selectedServiceIds} onChange={setSelectedServiceIds} />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-semibold text-netfive-gray-100">Acompanhamento</legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="healthScore">Health Score (0-100)</label>
              <input id="healthScore" type="number" min={0} max={100} className="input-field" value={form.healthScore} onChange={(e) => set("healthScore", e.target.value)} />
              {fieldError("healthScore") && <p className="field-error">{fieldError("healthScore")}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="healthStatus">Status de saúde</label>
              <select id="healthStatus" className="input-field" value={form.healthStatus} onChange={(e) => set("healthStatus", e.target.value)}>
                {HEALTH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="healthReason">Motivo da avaliação</label>
              <textarea id="healthReason" className="input-field" rows={2} value={form.healthReason} onChange={(e) => set("healthReason", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="attentionPoints">Pontos de atenção</label>
              <textarea id="attentionPoints" className="input-field" rows={2} value={form.attentionPoints} onChange={(e) => set("attentionPoints", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="actionPlan">Plano de ação</label>
              <textarea id="actionPlan" className="input-field" rows={2} value={form.actionPlan} onChange={(e) => set("actionPlan", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="lastContact">Último contato</label>
              <input id="lastContact" type="date" className="input-field" value={form.lastContact} onChange={(e) => set("lastContact", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="nextContact">Próximo contato</label>
              <input id="nextContact" type="date" className="input-field" value={form.nextContact} onChange={(e) => set("nextContact", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="lastVisit">Última visita</label>
              <input id="lastVisit" type="date" className="input-field" value={form.lastVisit} onChange={(e) => set("lastVisit", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="nextVisit">Próxima visita</label>
              <input id="nextVisit" type="date" className="input-field" value={form.nextVisit} onChange={(e) => set("nextVisit", e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-semibold text-netfive-gray-100">Relacionamento e crescimento</legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="needs">Necessidades</label>
              <textarea id="needs" className="input-field" rows={2} value={form.needs} onChange={(e) => set("needs", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="currentPerception">Percepção atual</label>
              <textarea id="currentPerception" className="input-field" rows={2} value={form.currentPerception} onChange={(e) => set("currentPerception", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="expansionPlan">Plano de expansão</label>
              <textarea id="expansionPlan" className="input-field" rows={2} value={form.expansionPlan} onChange={(e) => set("expansionPlan", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="growthEstimate">Estimativa de crescimento</label>
              <input id="growthEstimate" className="input-field" value={form.growthEstimate} onChange={(e) => set("growthEstimate", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="expansionNextStep">Próximo passo de expansão</label>
              <input id="expansionNextStep" className="input-field" value={form.expansionNextStep} onChange={(e) => set("expansionNextStep", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="opportunities">Oportunidades</label>
              <textarea id="opportunities" className="input-field" rows={2} value={form.opportunities} onChange={(e) => set("opportunities", e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-semibold text-netfive-gray-100">Faturamento (dados públicos)</legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="annualRevenue">Valor</label>
              <input id="annualRevenue" type="number" min={0} step="0.01" className="input-field" value={form.annualRevenue} onChange={(e) => set("annualRevenue", e.target.value)} />
              {fieldError("annualRevenue") && <p className="field-error">{fieldError("annualRevenue")}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="fiscalYear">Ano fiscal</label>
              <input id="fiscalYear" type="number" className="input-field" value={form.fiscalYear} onChange={(e) => set("fiscalYear", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="revenueMetric">Métrica</label>
              <input id="revenueMetric" className="input-field" placeholder="Faturamento, receita bruta, receita líquida..." value={form.revenueMetric} onChange={(e) => set("revenueMetric", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="revenuePeriod">Período</label>
              <input id="revenuePeriod" className="input-field" value={form.revenuePeriod} onChange={(e) => set("revenuePeriod", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="revenueSourceTitle">Nome da fonte</label>
              <input id="revenueSourceTitle" className="input-field" value={form.revenueSourceTitle} onChange={(e) => set("revenueSourceTitle", e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="revenueSourceUrl">URL da fonte</label>
              <input id="revenueSourceUrl" type="url" className="input-field" placeholder="https://" value={form.revenueSourceUrl} onChange={(e) => set("revenueSourceUrl", e.target.value)} />
              {fieldError("revenueSourceUrl") && <p className="field-error">{fieldError("revenueSourceUrl")}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="revenueVerifiedAt">Data da verificação</label>
              <input id="revenueVerifiedAt" type="date" className="input-field" value={form.revenueVerifiedAt} onChange={(e) => set("revenueVerifiedAt", e.target.value)} />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="flex justify-end gap-3 border-t border-netfive-border pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
