export type KpiTone = "neutral" | "good" | "warning" | "critical";

/** Conta de problemas (mais é pior): 0 = bom, até 15% da carteira = médio, acima = preocupante. */
export function riskCountTone(count: number, total: number): KpiTone {
  if (count === 0) return "good";
  if (total === 0) return "neutral";
  return count / total <= 0.15 ? "warning" : "critical";
}

/** Cobertura (mais é melhor): percentual 0-100. */
export function coveragePercentTone(percent: number, total: number): KpiTone {
  if (total === 0) return "neutral";
  if (percent >= 80) return "good";
  if (percent >= 40) return "warning";
  return "critical";
}
