import type { CustomerDetailDTO } from "@/lib/types";
import { toDateInputValue } from "@/lib/format";

/** Payload aceito por POST/PUT /api/customers — mesmo formato que customerInputSchema espera antes da validação. */
export interface CustomerApiPayload {
  companyName: string;
  csOwner: string;
  category: string;
  segment?: string;
  segmentSourceTitle?: string;
  segmentSourceUrl?: string;
  segmentVerifiedAt?: string;
  contactName?: string;
  contactRole?: string;
  contactInfo?: string;
  technicalOwner?: string;
  startDate?: string;
  renewalDate?: string;
  healthScore: number | null;
  healthStatus: string;
  healthReason?: string;
  attentionPoints?: string;
  actionPlan?: string;
  lastContact?: string;
  nextContact?: string;
  lastVisit?: string;
  nextVisit?: string;
  needs?: string;
  currentPerception?: string;
  expansionPlan?: string;
  growthEstimate?: string;
  opportunities?: string;
  expansionNextStep?: string;
  annualRevenue: number | null;
  fiscalYear: number | null;
  revenueMetric?: string;
  revenuePeriod?: string;
  revenueSourceTitle?: string;
  revenueSourceUrl?: string;
  revenueVerifiedAt?: string;
  serviceIds: string[];
}

/** Converte o cliente atual (como veio da API) no payload de edição, pronto para sobrescrever um único campo por vez. */
export function customerToApiPayload(customer: CustomerDetailDTO): CustomerApiPayload {
  return {
    companyName: customer.companyName,
    csOwner: customer.csOwner,
    category: customer.category,
    segment: customer.segment ?? undefined,
    segmentSourceTitle: customer.segmentSourceTitle ?? undefined,
    segmentSourceUrl: customer.segmentSourceUrl ?? undefined,
    segmentVerifiedAt: toDateInputValue(customer.segmentVerifiedAt) || undefined,
    contactName: customer.contactName ?? undefined,
    contactRole: customer.contactRole ?? undefined,
    contactInfo: customer.contactInfo ?? undefined,
    technicalOwner: customer.technicalOwner ?? undefined,
    startDate: toDateInputValue(customer.startDate) || undefined,
    renewalDate: toDateInputValue(customer.renewalDate) || undefined,
    healthScore: customer.healthScore,
    healthStatus: customer.healthStatus,
    healthReason: customer.healthReason ?? undefined,
    attentionPoints: customer.attentionPoints ?? undefined,
    actionPlan: customer.actionPlan ?? undefined,
    lastContact: toDateInputValue(customer.lastContact) || undefined,
    nextContact: toDateInputValue(customer.nextContact) || undefined,
    lastVisit: toDateInputValue(customer.lastVisit) || undefined,
    nextVisit: toDateInputValue(customer.nextVisit) || undefined,
    needs: customer.needs ?? undefined,
    currentPerception: customer.currentPerception ?? undefined,
    expansionPlan: customer.expansionPlan ?? undefined,
    growthEstimate: customer.growthEstimate ?? undefined,
    opportunities: customer.opportunities ?? undefined,
    expansionNextStep: customer.expansionNextStep ?? undefined,
    annualRevenue: customer.annualRevenue,
    fiscalYear: customer.fiscalYear,
    revenueMetric: customer.revenueMetric ?? undefined,
    revenuePeriod: customer.revenuePeriod ?? undefined,
    revenueSourceTitle: customer.revenueSourceTitle ?? undefined,
    revenueSourceUrl: customer.revenueSourceUrl ?? undefined,
    revenueVerifiedAt: toDateInputValue(customer.revenueVerifiedAt) || undefined,
    serviceIds: customer.services.map((s) => s.id),
  };
}
