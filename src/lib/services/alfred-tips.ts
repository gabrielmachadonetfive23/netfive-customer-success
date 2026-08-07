import type { CustomerDTO } from "@/lib/types";
import {
  getOverdueContacts,
  getUpcomingRenewals,
  getTopNoContactCustomers,
  getNoVisitCustomers,
} from "@/lib/services/statistics-analytics";

export type AlfredTipSeverity = "critical" | "warning" | "info";

export interface AlfredTip {
  id: string;
  customerId: string;
  companyName: string;
  csOwner: string;
  severity: AlfredTipSeverity;
  message: string;
}

interface ScoredTip extends AlfredTip {
  priority: number;
}

const MAX_TIPS = 24;

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/**
 * Gera os alertas do card "Dicas do Alfred" a partir dos mesmos dados já
 * usados nos painéis de Estatísticas — sem chamada a LLM, então o card nunca
 * fica vazio nem depende de custo/latência de API externa.
 */
export function generateAlfredTips(customers: CustomerDTO[], now: Date): AlfredTip[] {
  const scored: ScoredTip[] = [];

  for (const entry of getOverdueContacts(customers, now)) {
    const name = firstName(entry.csOwner);
    scored.push({
      id: `overdue-${entry.customerId}`,
      customerId: entry.customerId,
      companyName: entry.companyName,
      csOwner: entry.csOwner,
      severity: entry.daysOverdue > 7 ? "critical" : "warning",
      message:
        entry.daysOverdue <= 1
          ? `${name}, você deveria falar com ${entry.companyName} hoje — o contato estava previsto para ontem.`
          : `${name}, você deveria falar com ${entry.companyName} hoje — o contato está ${entry.daysOverdue} dias atrasado.`,
      priority: 1000 + entry.daysOverdue,
    });
  }

  for (const customer of customers) {
    if (customer.healthStatus !== "Crítico") continue;
    scored.push({
      id: `health-${customer.id}`,
      customerId: customer.id,
      companyName: customer.companyName,
      csOwner: customer.csOwner,
      severity: "critical",
      message: `${firstName(customer.csOwner)}, ${customer.companyName} está com saúde crítica — vale investigar o que está acontecendo.`,
      priority: 950,
    });
  }

  for (const entry of getUpcomingRenewals(customers, now, 90)) {
    const name = firstName(entry.csOwner);
    scored.push({
      id: `renewal-${entry.customerId}`,
      customerId: entry.customerId,
      companyName: entry.companyName,
      csOwner: entry.csOwner,
      severity: entry.daysUntilRenewal <= 15 ? "critical" : entry.daysUntilRenewal <= 45 ? "warning" : "info",
      message:
        entry.daysUntilRenewal === 0
          ? `${name}, o contrato da ${entry.companyName} vence hoje.`
          : `${name}, o contrato da ${entry.companyName} vence em ${entry.daysUntilRenewal} dias.`,
      priority: 900 + (90 - entry.daysUntilRenewal),
    });
  }

  for (const entry of getTopNoContactCustomers(customers, now)) {
    scored.push({
      id: `no-contact-${entry.customerId}`,
      customerId: entry.customerId,
      companyName: entry.companyName,
      csOwner: entry.csOwner,
      severity: entry.daysWithoutContact > 45 ? "warning" : "info",
      message: `${firstName(entry.csOwner)}, já fazem ${entry.daysWithoutContact} dias sem contato com ${entry.companyName} — vale aquecer o relacionamento.`,
      priority: 500 + entry.daysWithoutContact,
    });
  }

  for (const entry of getNoVisitCustomers(customers, now)) {
    scored.push({
      id: `no-visit-${entry.customerId}`,
      customerId: entry.customerId,
      companyName: entry.companyName,
      csOwner: entry.csOwner,
      severity: entry.daysSinceVisit === null || entry.daysSinceVisit > 120 ? "warning" : "info",
      message:
        entry.daysSinceVisit === null
          ? `${firstName(entry.csOwner)}, ${entry.companyName} nunca recebeu uma visita — talvez seja hora de agendar uma.`
          : `${firstName(entry.csOwner)}, já fazem ${entry.daysSinceVisit} dias sem visitar ${entry.companyName}.`,
      priority: 400 + (entry.daysSinceVisit ?? 200),
    });
  }

  return scored
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_TIPS)
    .map((tip) => ({
      id: tip.id,
      customerId: tip.customerId,
      companyName: tip.companyName,
      csOwner: tip.csOwner,
      severity: tip.severity,
      message: tip.message,
    }));
}
