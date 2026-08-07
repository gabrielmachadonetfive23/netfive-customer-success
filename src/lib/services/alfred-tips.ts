import type { CustomerDTO, NewsArticleDTO, NpsResponseDTO, QbrActivityDTO, MeetingDTO } from "@/lib/types";
import {
  getOverdueContacts,
  getUpcomingRenewals,
  getTopNoContactCustomers,
  getNoVisitCustomers,
} from "@/lib/services/statistics-analytics";
import { getUpcomingVisits } from "@/lib/services/visits-analytics";
import { getCurrentReportingFiscalYear } from "@/lib/services/fiscal-year";
import { isNonEmpty, diffInDays, startOfDay } from "@/lib/services/date-utils";
import { normalizeMetricPercent } from "@/lib/meeting-format";
import { formatDate } from "@/lib/format";

export type AlfredTipSeverity = "critical" | "warning" | "info";

export interface AlfredTip {
  id: string;
  message: string;
  severity: AlfredTipSeverity;
  /** Se definido, o clique na dica abre a ficha desse cliente. */
  customerId?: string | null;
  /** Se definido (e sem customerId), o clique na dica abre esse link em nova aba. */
  url?: string | null;
}

interface ScoredTip extends AlfredTip {
  priority: number;
}

const MAX_TIPS = 24;

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** Ordena do mais urgente ao menos, corta no teto e descarta o campo interno de prioridade. */
function finalize(scored: ScoredTip[]): AlfredTip[] {
  return scored
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_TIPS)
    .map((tip) => ({ id: tip.id, message: tip.message, severity: tip.severity, customerId: tip.customerId, url: tip.url }));
}

/**
 * Dicas do módulo Visão geral: panorama geral da carteira (contatos em
 * atraso, saúde crítica, renovações, falta de contato/visita). Sem chamada a
 * LLM — puramente derivado dos mesmos dados usados em Estatísticas.
 */
export function generateDashboardTips(customers: CustomerDTO[], now: Date): AlfredTip[] {
  const scored: ScoredTip[] = [];

  for (const entry of getOverdueContacts(customers, now)) {
    const name = firstName(entry.csOwner);
    scored.push({
      id: `overdue-${entry.customerId}`,
      customerId: entry.customerId,
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
      severity: entry.daysWithoutContact > 45 ? "warning" : "info",
      message: `${firstName(entry.csOwner)}, já fazem ${entry.daysWithoutContact} dias sem contato com ${entry.companyName} — vale aquecer o relacionamento.`,
      priority: 500 + entry.daysWithoutContact,
    });
  }

  for (const entry of getNoVisitCustomers(customers, now)) {
    scored.push({
      id: `no-visit-${entry.customerId}`,
      customerId: entry.customerId,
      severity: entry.daysSinceVisit === null || entry.daysSinceVisit > 120 ? "warning" : "info",
      message:
        entry.daysSinceVisit === null
          ? `${firstName(entry.csOwner)}, ${entry.companyName} nunca recebeu uma visita — talvez seja hora de agendar uma.`
          : `${firstName(entry.csOwner)}, já fazem ${entry.daysSinceVisit} dias sem visitar ${entry.companyName}.`,
      priority: 400 + (entry.daysSinceVisit ?? 200),
    });
  }

  return finalize(scored);
}

/** Dicas do módulo Visitas: visitas de hoje, próximas, atrasadas e clientes há muito sem visita. */
export function generateVisitTips(customers: CustomerDTO[], now: Date): AlfredTip[] {
  const scored: ScoredTip[] = [];
  const today = startOfDay(now);

  for (const visit of getUpcomingVisits(customers, now)) {
    const name = firstName(visit.csOwner);
    if (visit.isToday) {
      scored.push({
        id: `visit-today-${visit.customerId}`,
        customerId: visit.customerId,
        severity: "critical",
        message: `${name}, você tem visita marcada hoje na ${visit.companyName}.`,
        priority: 1000,
      });
    } else if (visit.daysUntil <= 7) {
      scored.push({
        id: `visit-soon-${visit.customerId}`,
        customerId: visit.customerId,
        severity: "warning",
        message: `${name}, visita na ${visit.companyName} em ${visit.daysUntil} dia(s).`,
        priority: 900 - visit.daysUntil,
      });
    }
  }

  for (const customer of customers) {
    if (!customer.nextVisit || startOfDay(new Date(customer.nextVisit)) >= today) continue;
    scored.push({
      id: `visit-overdue-${customer.id}`,
      customerId: customer.id,
      severity: "critical",
      message: `${firstName(customer.csOwner)}, a visita à ${customer.companyName} estava marcada para ${formatDate(customer.nextVisit)} e a data já passou — vale atualizar.`,
      priority: 1100,
    });
  }

  for (const entry of getNoVisitCustomers(customers, now)) {
    scored.push({
      id: `no-visit-${entry.customerId}`,
      customerId: entry.customerId,
      severity: entry.daysSinceVisit === null || entry.daysSinceVisit > 120 ? "warning" : "info",
      message:
        entry.daysSinceVisit === null
          ? `${firstName(entry.csOwner)}, ${entry.companyName} nunca recebeu uma visita.`
          : `${firstName(entry.csOwner)}, já fazem ${entry.daysSinceVisit} dias sem visitar ${entry.companyName}.`,
      priority: 400 + (entry.daysSinceVisit ?? 200),
    });
  }

  return finalize(scored);
}

/** Dicas do módulo Clientes: qualidade dos dados de segmento e faturamento exibidos nessa página. */
export function generateClientTips(customers: CustomerDTO[], now: Date): AlfredTip[] {
  const scored: ScoredTip[] = [];
  const fiscalYear = getCurrentReportingFiscalYear(now);

  for (const customer of customers) {
    if (isNonEmpty(customer.segment)) continue;
    scored.push({
      id: `segment-${customer.id}`,
      customerId: customer.id,
      severity: "info",
      message: `${firstName(customer.csOwner)}, o segmento da ${customer.companyName} ainda não foi informado.`,
      priority: 300,
    });
  }

  for (const customer of customers) {
    const hasCurrentRevenue =
      customer.fiscalYear === fiscalYear && customer.annualRevenue !== null && customer.annualRevenue > 0;
    if (!hasCurrentRevenue || isNonEmpty(customer.revenueSourceUrl)) continue;
    scored.push({
      id: `revenue-source-${customer.id}`,
      customerId: customer.id,
      severity: "warning",
      message: `${firstName(customer.csOwner)}, vale confirmar a fonte do faturamento divulgado da ${customer.companyName}.`,
      priority: 500,
    });
  }

  return finalize(scored);
}

/** Dicas do módulo Estatísticas: o caso mais crítico de cada painel exibido na página. */
export function generateStatisticsTips(customers: CustomerDTO[], now: Date): AlfredTip[] {
  const scored: ScoredTip[] = [];

  const [topOverdue] = getOverdueContacts(customers, now);
  if (topOverdue) {
    scored.push({
      id: `stats-overdue-${topOverdue.customerId}`,
      customerId: topOverdue.customerId,
      severity: "critical",
      message: `${firstName(topOverdue.csOwner)}, o contato mais atrasado da carteira é com ${topOverdue.companyName} — ${topOverdue.daysOverdue} dias.`,
      priority: 1000,
    });
  }

  const [topRenewal] = getUpcomingRenewals(customers, now, 90);
  if (topRenewal) {
    scored.push({
      id: `stats-renewal-${topRenewal.customerId}`,
      customerId: topRenewal.customerId,
      severity: topRenewal.daysUntilRenewal <= 15 ? "critical" : "warning",
      message: `${firstName(topRenewal.csOwner)}, a renovação mais próxima da carteira é a da ${topRenewal.companyName}, em ${topRenewal.daysUntilRenewal} dias.`,
      priority: 950,
    });
  }

  const [topNoContact] = getTopNoContactCustomers(customers, now);
  if (topNoContact) {
    scored.push({
      id: `stats-no-contact-${topNoContact.customerId}`,
      customerId: topNoContact.customerId,
      severity: "warning",
      message: `${firstName(topNoContact.csOwner)}, ${topNoContact.companyName} está há ${topNoContact.daysWithoutContact} dias sem contato — o maior tempo da carteira.`,
      priority: 900,
    });
  }

  const [topNoVisit] = getNoVisitCustomers(customers, now);
  if (topNoVisit) {
    scored.push({
      id: `stats-no-visit-${topNoVisit.customerId}`,
      customerId: topNoVisit.customerId,
      severity: "warning",
      message:
        topNoVisit.daysSinceVisit === null
          ? `${firstName(topNoVisit.csOwner)}, ${topNoVisit.companyName} nunca recebeu uma visita.`
          : `${firstName(topNoVisit.csOwner)}, ${topNoVisit.companyName} está há ${topNoVisit.daysSinceVisit} dias sem visita — o maior tempo da carteira.`,
      priority: 850,
    });
  }

  const critical = customers.filter((customer) => customer.healthStatus === "Crítico");
  if (critical.length > 0) {
    const counts = new Map<string, number>();
    for (const customer of critical) counts.set(customer.csOwner, (counts.get(customer.csOwner) ?? 0) + 1);
    const [topCsOwner, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] as [string, number];
    scored.push({
      id: `stats-health-concentration-${topCsOwner}`,
      severity: "critical",
      message: `${firstName(topCsOwner)} é responsável por ${topCount} de ${critical.length} clientes em saúde crítica na carteira.`,
      priority: 1050,
    });
  }

  return finalize(scored);
}

/** Dicas do módulo Notícias: alertas de segurança recentes e o segmento mais coberto na lista atual. */
export function generateNewsTips(articles: NewsArticleDTO[]): AlfredTip[] {
  const scored: ScoredTip[] = [];

  const securityArticles = articles.filter((article) => article.category === "seguranca").slice(0, 5);
  securityArticles.forEach((article, index) => {
    scored.push({
      id: `news-security-${article.id}`,
      url: article.url,
      severity: "warning",
      message: `Alerta de segurança: ${article.title}`,
      priority: 800 - index,
    });
  });

  const segmentCounts = new Map<string, number>();
  for (const article of articles) {
    for (const segment of article.segments) segmentCounts.set(segment, (segmentCounts.get(segment) ?? 0) + 1);
  }
  const topSegment = [...segmentCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topSegment) {
    scored.push({
      id: `news-segment-${topSegment[0]}`,
      severity: "info",
      message: `${topSegment[1]} notícia(s) recente(s) sobre o segmento ${topSegment[0]}.`,
      priority: 300,
    });
  }

  return finalize(scored);
}

/** Dicas do módulo NPS: detratores pedindo atenção e respostas sem nota lançada. */
export function generateNpsTips(responses: NpsResponseDTO[]): AlfredTip[] {
  const scored: ScoredTip[] = [];

  for (const response of responses) {
    if (response.category !== "Detrator") continue;
    scored.push({
      id: `nps-detractor-${response.id}`,
      severity: "critical",
      message: `${response.companyName} respondeu como Detrator (nota ${response.score}) — vale entender o motivo e agir.`,
      priority: 1000,
    });
  }

  for (const response of responses) {
    if (response.score !== null) continue;
    scored.push({
      id: `nps-pending-${response.id}`,
      severity: "info",
      message: `${response.companyName} ainda não tem nota de NPS lançada.`,
      priority: 300,
    });
  }

  return finalize(scored);
}

/** Dicas do módulo QBR/SBR: atividades atrasadas, com link direto para a página no Notion. */
export function generateQbrTips(activities: QbrActivityDTO[]): AlfredTip[] {
  const scored: ScoredTip[] = [];

  for (const activity of activities) {
    if (!activity.overdue) continue;
    const prefix = activity.responsavel ? `${firstName(activity.responsavel)}, ` : "";
    const client = activity.cliente ? ` da ${activity.cliente}` : "";
    scored.push({
      id: `qbr-overdue-${activity.id}`,
      url: activity.notionUrl,
      severity: "critical",
      message: `${prefix}a atividade "${activity.activity}"${client} está atrasada.`,
      priority: activity.dueDate ? 1000 + Math.max(0, diffInDays(new Date(), new Date(activity.dueDate))) : 1000,
    });
  }

  return finalize(scored);
}

/** Dicas do módulo Reuniões: reuniões com engajamento ou sentimento baixo, com link direto para o relatório. */
export function generateMeetingTips(meetings: MeetingDTO[]): AlfredTip[] {
  const scored: ScoredTip[] = [];

  for (const meeting of meetings) {
    const engagement = normalizeMetricPercent(meeting.engagement);
    if (engagement !== null && engagement < 40) {
      scored.push({
        id: `meeting-engagement-${meeting.id}`,
        url: meeting.reportUrl,
        severity: "warning",
        message: `A reunião "${meeting.title}" teve engajamento baixo (${Math.round(engagement)}%) — vale um follow-up.`,
        priority: 1000 - engagement,
      });
    }

    const sentiment = normalizeMetricPercent(meeting.sentiment);
    if (sentiment !== null && sentiment < 40) {
      scored.push({
        id: `meeting-sentiment-${meeting.id}`,
        url: meeting.reportUrl,
        severity: "warning",
        message: `A reunião "${meeting.title}" teve sentimento baixo (${Math.round(sentiment)}%) — vale atenção.`,
        priority: 900 - sentiment,
      });
    }
  }

  return finalize(scored);
}
