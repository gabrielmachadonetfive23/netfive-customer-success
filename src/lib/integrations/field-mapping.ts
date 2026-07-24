import type { CustomerDTO } from "@/lib/types";

export type SyncFieldKind = "text" | "number" | "date" | "services";

export interface SyncFieldDefinition {
  /** Campo correspondente em CustomerDTO (ou "services" para o seletor de serviços). */
  key: keyof CustomerDTO | "services";
  kind: SyncFieldKind;
  /**
   * Nome usado para localizar a coluna no Smartsheet (título da coluna) ou o
   * campo customizado no Pipedrive (nome do campo em Configurações > Campos).
   * A sincronização localiza colunas/campos pelo nome, não por ID.
   */
  externalName: string;
}

/**
 * Mapeamento para a planilha Smartsheet "Controle Expansão da Base
 * (Up-Sell/Cross-Sell)" (sheet ID configurado em SMARTSHEET_SHEET_ID).
 * Os nomes abaixo batem exatamente com os títulos reais das colunas dessa
 * planilha (alguns têm espaço no final — não remova).
 *
 * Campos do cliente sem coluna correspondente nessa planilha (segmento,
 * contato, faturamento, datas de início/renovação, responsável técnico)
 * simplesmente não são sincronizados com o Smartsheet.
 *
 * A coluna "Observações" da planilha não é sincronizada: ela é um único
 * campo de texto, enquanto na plataforma observações são um histórico
 * (lista) por cliente — os dois modelos não são compatíveis 1:1.
 */
export const SMARTSHEET_SYNC_FIELDS: readonly SyncFieldDefinition[] = [
  { key: "companyName", kind: "text", externalName: "Cliente" },
  { key: "csOwner", kind: "text", externalName: "CS" },
  { key: "category", kind: "text", externalName: "Categoria" },
  { key: "services", kind: "services", externalName: "Escopo Contratado" },
  { key: "healthScore", kind: "number", externalName: "Health Score" },
  { key: "expansionPlan", kind: "text", externalName: "Plano de Expansão (lista serviço/produto)" },
  { key: "growthEstimate", kind: "text", externalName: "Estimativa de Crescimento $$" },
  { key: "actionPlan", kind: "text", externalName: "Plano de Ação do Ano" },
  { key: "lastContact", kind: "date", externalName: "Último Contato " },
  { key: "nextContact", kind: "date", externalName: "Próximo Contato" },
  { key: "lastVisit", kind: "date", externalName: "Última Visita " },
  { key: "nextVisit", kind: "date", externalName: "Próxima Visita " },
] as const;

/**
 * Mapeamento para os campos customizados de Organização no Pipedrive.
 * Ainda não configurado com nomes reais — ajuste os `externalName` abaixo
 * para baterem exatamente com os campos criados em Configurações > Campos
 * quando a integração Pipedrive for ativada.
 */
export const PIPEDRIVE_SYNC_FIELDS: readonly SyncFieldDefinition[] = [
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
