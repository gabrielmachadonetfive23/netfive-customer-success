import type { CustomerDTO } from "@/lib/types";
import { isNonEmpty } from "@/lib/services/date-utils";

export interface DashboardKpis {
  totalCustomers: number;
  healthEvaluated: number;
  expansionPlans: number;
  upcomingContacts: number;
}

export function computeDashboardKpis(customers: CustomerDTO[], now: Date): DashboardKpis {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return {
    totalCustomers: customers.length,
    healthEvaluated: customers.filter((c) => c.healthStatus !== "Não avaliado").length,
    expansionPlans: customers.filter((c) => isNonEmpty(c.expansionPlan)).length,
    upcomingContacts: customers.filter((c) => c.nextContact !== null && new Date(c.nextContact) >= today)
      .length,
  };
}
