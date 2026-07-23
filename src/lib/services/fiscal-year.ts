/**
 * O ano fiscal considerado nos gráficos e KPIs financeiros é sempre o ano
 * anterior ao ano corrente do servidor (nunca fixo no código).
 * Exemplo: em 2026, considera-se o FY 2025; em 2027, o FY 2026.
 */
export function getCurrentReportingFiscalYear(referenceDate: Date = new Date()): number {
  return referenceDate.getFullYear() - 1;
}
