import type { CustomerDTO } from "@/lib/types";
import { getCurrentReportingFiscalYear } from "@/lib/services/fiscal-year";
import { isNonEmpty } from "@/lib/services/date-utils";

export interface ClientsKpis {
  fiscalYear: number;
  totalCustomers: number;
  withSegment: number;
  withSegmentPercent: number;
  totalPublicRevenue: number;
  verifiedRevenueCount: number;
  averageDisclosedRevenue: number | null;
}

export interface SegmentSlice {
  segment: string;
  count: number;
  percent: number;
}

export interface FinancialBarEntry {
  customerId: string;
  companyName: string;
  value: number | null; // null = "—" (sem dado no FY corrente)
  hasVerifiedSource: boolean;
}

const NOT_INFORMED_SEGMENT = "Não informado";

function isRevenueForCurrentFiscalYear(customer: CustomerDTO, fiscalYear: number): boolean {
  return customer.fiscalYear === fiscalYear && customer.annualRevenue !== null && customer.annualRevenue > 0;
}

export function computeClientsKpis(customers: CustomerDTO[], now: Date): ClientsKpis {
  const fiscalYear = getCurrentReportingFiscalYear(now);
  const withSegment = customers.filter((c) => isNonEmpty(c.segment)).length;
  const verified = customers.filter((c) => isRevenueForCurrentFiscalYear(c, fiscalYear));
  const totalPublicRevenue = verified.reduce((sum, c) => sum + (c.annualRevenue as number), 0);

  return {
    fiscalYear,
    totalCustomers: customers.length,
    withSegment,
    withSegmentPercent: customers.length > 0 ? (withSegment / customers.length) * 100 : 0,
    totalPublicRevenue,
    verifiedRevenueCount: verified.length,
    averageDisclosedRevenue: verified.length > 0 ? totalPublicRevenue / verified.length : null,
  };
}

export function computeSegmentDistribution(customers: CustomerDTO[]): SegmentSlice[] {
  const counts = new Map<string, number>();

  for (const customer of customers) {
    const key = isNonEmpty(customer.segment) ? (customer.segment as string) : NOT_INFORMED_SEGMENT;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = customers.length;
  return Array.from(counts.entries())
    .map(([segment, count]) => ({ segment, count, percent: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

export function computeFinancialBarData(customers: CustomerDTO[], now: Date): FinancialBarEntry[] {
  const fiscalYear = getCurrentReportingFiscalYear(now);

  return customers
    .map((customer) => ({
      customerId: customer.id,
      companyName: customer.companyName,
      value: isRevenueForCurrentFiscalYear(customer, fiscalYear) ? (customer.annualRevenue as number) : null,
      hasVerifiedSource: isNonEmpty(customer.revenueSourceUrl),
    }))
    .sort((a, b) => {
      if (a.value === null && b.value === null) return a.companyName.localeCompare(b.companyName);
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return b.value - a.value;
    });
}
