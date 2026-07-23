export const ALLOWED_CATEGORIES = ["AA", "A", "B", "C", "D", "E"] as const;
export type Category = (typeof ALLOWED_CATEGORIES)[number];

export const HEALTH_STATUSES = ["Saudável", "Atenção", "Crítico", "Não avaliado"] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export const DEFAULT_HEALTH_STATUS: HealthStatus = "Não avaliado";

/** Catálogo oficial de serviços Netfive, usado no seed do banco. */
export const SERVICE_CATALOG: readonly string[] = [
  "Monitoramento de Credenciais Vazadas",
  "Gestão de Risco de Terceiros",
  "Governança, Risco e Conformidade",
  "Governança de IA",
  "Diagnóstico de SI",
  "Gestão de Risco Cibernético (GRC)",
  "Semana de Conscientização",
  "Campanha de Phishing",
  "Treinamento e Conscientização",
  "Palestra e Workshop",
  "Gestão de Risco Humano",
  "Recon5 (Pentest como serviço)",
  "Pentest Externo",
  "Pentest Interno",
  "Pentest de Aplicação",
  "Pentest Mobile",
  "Pentest de API",
  "Pentest de IA",
  "MDR",
  "NG-SOC",
  "Gestão de Patches de Vulnerabilidades",
  "Resposta a Incidente",
  "Pure 4R",
  "Professional Services Crowdstrike",
  "Professional Services Zscaler",
  "Professional Services Vicarius",
  "Professional Services VMWare",
  "Professional Services Veeam",
  "Professional Services Pure",
  "Professional Services Linux",
  "Monitoramento de Infraestrutura",
  "vCISO",
];

/** Normaliza nomes de serviços legados que vieram com grafia divergente. */
export const SERVICE_NAME_ALIASES: Readonly<Record<string, string>> = {
  "Monitoramento de Credencias Vazadas": "Monitoramento de Credenciais Vazadas",
};

export function normalizeServiceName(rawName: string): string {
  const trimmed = rawName.trim();
  return SERVICE_NAME_ALIASES[trimmed] ?? trimmed;
}

export const SESSION_DURATION_MS = 48 * 60 * 60 * 1000; // 48 horas

export const SESSION_COOKIE_NAME = "netfive_cs_session";
