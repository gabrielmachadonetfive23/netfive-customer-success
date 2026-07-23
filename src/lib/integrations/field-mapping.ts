import type { CustomerDTO } from "@/lib/types";

export type SyncFieldKind = "text" | "number" | "date" | "services";

export interface SyncFieldDefinition {
  /** Campo correspondente em CustomerDTO (ou "services" para o seletor de serviços). */
  key: keyof CustomerDTO | "services";
  kind: SyncFieldKind;
  /**
   * Nome usado para localizar a coluna no Smartsheet (título da coluna) e o
   * campo customizado no Pipedrive (nome do campo em Configurações > Campos).
   * AJUSTE ESTES NOMES para bater exatamente com o que existe nas suas contas
   * de Smartsheet e Pipedrive — a sincronização localiza colunas/campos pelo
   * nome, não por ID, então basta manter os nomes idênticos dos dois lados.
   */
  externalName: string;
}

/**
 * Mapeamento editável entre os campos do cliente e as colunas/campos externos.
 * Observações (histórico) e identificadores internos não são sincronizados.
 */
export const SYNC_FIELDS: readonly SyncFieldDefinition[] = [
  { key: "companyName", kind: "text", externalName: "Empresa" },
  { key: "csOwner", kind: "text", externalName: "CS Responsável" },
  { key: "category", kind: "text", externalName: "Categoria" },
  { key: "segment", kind: "text", externalName: "Segmento" },
  { key: "segmentSourceTitle", kind: "text", externalName: "Fonte do Segmento" },
  { key: "segmentSourceUrl", kind: "text", externalName: "Link da Fonte do Segmento" },
  { key: "segmentVerifiedAt", kind: "date", externalName: "Segmento Verificado Em" },
  { key: "contactName", kind: "text", externalName: "Contato Principal" },
  { key: "contactRole", kind: "text", externalName: "Cargo do Contato" },
  { key: "contactInfo", kind: "text", externalName: "Telefone/E-mail do Contato" },
  { key: "technicalOwner", kind: "text", externalName: "Responsável Técnico" },
  { key: "startDate", kind: "date", externalName: "Início do Cliente" },
  { key: "renewalDate", kind: "date", externalName: "Renovação" },
  { key: "healthScore", kind: "number", externalName: "Health Score" },
  { key: "healthStatus", kind: "text", externalName: "Status de Saúde" },
  { key: "healthReason", kind: "text", externalName: "Motivo do Health Score" },
  { key: "attentionPoints", kind: "text", externalName: "Pontos de Atenção" },
  { key: "actionPlan", kind: "text", externalName: "Plano de Ação" },
  { key: "lastContact", kind: "date", externalName: "Último Contato" },
  { key: "nextContact", kind: "date", externalName: "Próximo Contato" },
  { key: "lastVisit", kind: "date", externalName: "Última Visita" },
  { key: "nextVisit", kind: "date", externalName: "Próxima Visita" },
  { key: "needs", kind: "text", externalName: "Necessidades" },
  { key: "currentPerception", kind: "text", externalName: "Percepção Atual" },
  { key: "expansionPlan", kind: "text", externalName: "Plano de Expansão" },
  { key: "growthEstimate", kind: "text", externalName: "Estimativa de Crescimento" },
  { key: "opportunities", kind: "text", externalName: "Oportunidades" },
  { key: "expansionNextStep", kind: "text", externalName: "Próximo Passo de Expansão" },
  { key: "annualRevenue", kind: "number", externalName: "Faturamento Anual" },
  { key: "fiscalYear", kind: "number", externalName: "Ano Fiscal" },
  { key: "revenueMetric", kind: "text", externalName: "Métrica de Receita" },
  { key: "revenuePeriod", kind: "text", externalName: "Período de Receita" },
  { key: "revenueSourceTitle", kind: "text", externalName: "Fonte Financeira" },
  { key: "revenueSourceUrl", kind: "text", externalName: "Link da Fonte Financeira" },
  { key: "revenueVerifiedAt", kind: "date", externalName: "Faturamento Verificado Em" },
  { key: "services", kind: "services", externalName: "Serviços Contratados" },
] as const;
