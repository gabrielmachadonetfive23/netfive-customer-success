import type { CustomerDTO } from "@/lib/types";
import { diffInDays, isNonEmpty, startOfDay } from "@/lib/services/date-utils";

export interface VisitCard {
  customerId: string;
  companyName: string;
  csOwner: string;
  visitDate: string; // ISO
  day: number;
  month: number;
  actionLabel: string;
  daysUntil: number;
  isToday: boolean;
}

export interface VisitsKpis {
  scheduledVisits: number;
  visitsNext30Days: number;
  csWithSchedule: number;
  customersWithoutNextVisit: number;
}

function buildActionLabel(customer: CustomerDTO): string {
  if (isNonEmpty(customer.actionPlan)) return customer.actionPlan as string;
  if (isNonEmpty(customer.expansionPlan)) return customer.expansionPlan as string;
  return "Visita de acompanhamento";
}

/** Retorna somente clientes com próxima visita a partir de hoje (inclusive), ordenados da mais próxima para a mais distante. */
export function getUpcomingVisits(customers: CustomerDTO[], now: Date): VisitCard[] {
  const today = startOfDay(now);

  return customers
    .filter((c) => c.nextVisit !== null && startOfDay(new Date(c.nextVisit)) >= today)
    .map((c) => {
      const visitDate = new Date(c.nextVisit as string);
      return {
        customerId: c.id,
        companyName: c.companyName,
        csOwner: c.csOwner,
        visitDate: c.nextVisit as string,
        day: visitDate.getDate(),
        month: visitDate.getMonth() + 1,
        actionLabel: buildActionLabel(c),
        daysUntil: diffInDays(visitDate, today),
        isToday: diffInDays(visitDate, today) === 0,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function computeVisitsKpis(customers: CustomerDTO[], now: Date): VisitsKpis {
  const upcoming = getUpcomingVisits(customers, now);
  const next30 = upcoming.filter((v) => v.daysUntil <= 30);
  const csWithSchedule = new Set(upcoming.map((v) => v.csOwner));
  const withoutNextVisit = customers.filter((c) => c.nextVisit === null).length;

  return {
    scheduledVisits: upcoming.length,
    visitsNext30Days: next30.length,
    csWithSchedule: csWithSchedule.size,
    customersWithoutNextVisit: withoutNextVisit,
  };
}
