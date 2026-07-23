import type { CustomerDTO } from "@/lib/types";
import { diffInDays, isNonEmpty, startOfDay } from "@/lib/services/date-utils";

export interface StatisticsKpis {
  noContactOver20Days: number;
  neverContacted: number;
  noVisitOver60Days: number;
  neverVisited: number;
  overdueNextContacts: number;
  healthPending: number;
  withExpansionPlan: number;
}

export interface NoContactEntry {
  customerId: string;
  companyName: string;
  csOwner: string;
  lastContact: string;
  daysWithoutContact: number;
}

export interface NoVisitEntry {
  customerId: string;
  companyName: string;
  csOwner: string;
  lastVisit: string | null;
  daysSinceVisit: number | null; // null = "nunca"
}

export interface OverdueContactEntry {
  customerId: string;
  companyName: string;
  csOwner: string;
  nextContact: string;
  daysOverdue: number;
}

export interface DistributionSlice {
  label: string;
  count: number;
  percent: number;
}

export function computeStatisticsKpis(customers: CustomerDTO[], now: Date): StatisticsKpis {
  const today = startOfDay(now);

  const noContactOver20Days = customers.filter(
    (c) => c.lastContact !== null && diffInDays(today, new Date(c.lastContact)) > 20,
  ).length;

  const neverContacted = customers.filter((c) => c.lastContact === null).length;

  const noVisitOver60Days = customers.filter(
    (c) => c.lastVisit !== null && diffInDays(today, new Date(c.lastVisit)) > 60,
  ).length;

  const neverVisited = customers.filter((c) => c.lastVisit === null).length;

  const overdueNextContacts = customers.filter(
    (c) => c.nextContact !== null && startOfDay(new Date(c.nextContact)) < today,
  ).length;

  const healthPending = customers.filter((c) => c.healthStatus === "Não avaliado").length;
  const withExpansionPlan = customers.filter((c) => isNonEmpty(c.expansionPlan)).length;

  return {
    noContactOver20Days,
    neverContacted,
    noVisitOver60Days,
    neverVisited,
    overdueNextContacts,
    healthPending,
    withExpansionPlan,
  };
}

/** Painel 1: até 10 clientes com maior número de dias sem contato (somente com contato registrado). */
export function getTopNoContactCustomers(customers: CustomerDTO[], now: Date, limit = 10): NoContactEntry[] {
  const today = startOfDay(now);

  return customers
    .filter((c) => c.lastContact !== null && diffInDays(today, new Date(c.lastContact)) > 20)
    .map((c) => ({
      customerId: c.id,
      companyName: c.companyName,
      csOwner: c.csOwner,
      lastContact: c.lastContact as string,
      daysWithoutContact: diffInDays(today, new Date(c.lastContact as string)),
    }))
    .sort((a, b) => b.daysWithoutContact - a.daysWithoutContact)
    .slice(0, limit);
}

/** Painel 2: clientes sem visita há mais de 60 dias, incluindo os nunca visitados ("nunca"), priorizando os mais críticos. */
export function getNoVisitCustomers(customers: CustomerDTO[], now: Date): NoVisitEntry[] {
  const today = startOfDay(now);

  return customers
    .filter((c) => c.lastVisit === null || diffInDays(today, new Date(c.lastVisit)) > 60)
    .map((c) => ({
      customerId: c.id,
      companyName: c.companyName,
      csOwner: c.csOwner,
      lastVisit: c.lastVisit,
      daysSinceVisit: c.lastVisit ? diffInDays(today, new Date(c.lastVisit)) : null,
    }))
    .sort((a, b) => {
      if (a.daysSinceVisit === null && b.daysSinceVisit === null) return a.companyName.localeCompare(b.companyName);
      if (a.daysSinceVisit === null) return -1;
      if (b.daysSinceVisit === null) return 1;
      return b.daysSinceVisit - a.daysSinceVisit;
    });
}

/** Painel 5: contatos planejados em atraso. */
export function getOverdueContacts(customers: CustomerDTO[], now: Date): OverdueContactEntry[] {
  const today = startOfDay(now);

  return customers
    .filter((c) => c.nextContact !== null && startOfDay(new Date(c.nextContact)) < today)
    .map((c) => ({
      customerId: c.id,
      companyName: c.companyName,
      csOwner: c.csOwner,
      nextContact: c.nextContact as string,
      daysOverdue: diffInDays(today, new Date(c.nextContact as string)),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/** Painel 3: carteira por Customer Success. */
export function getPortfolioByCsOwner(customers: CustomerDTO[]): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const c of customers) {
    counts.set(c.csOwner, (counts.get(c.csOwner) ?? 0) + 1);
  }
  const total = customers.length;
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percent: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

/** Painel 4: clientes por categoria. */
export function getDistributionByCategory(customers: CustomerDTO[]): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const c of customers) {
    counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  }
  const total = customers.length;
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percent: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}
