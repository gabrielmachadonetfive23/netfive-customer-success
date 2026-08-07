import type { AlfredToolDefinition } from "@/lib/integrations/anthropic/client";
import type { CustomerFilters } from "@/lib/types";
import { AppError } from "@/lib/api/errors";
import { findAllCustomersForAnalytics } from "@/lib/repositories/customer-repository";
import {
  getOverdueContacts,
  getUpcomingRenewals,
  getTopNoContactCustomers,
} from "@/lib/services/statistics-analytics";
import { findAllNpsResponses } from "@/lib/repositories/nps-repository";
import { computeNpsSummary } from "@/lib/services/nps-analytics";
import { findAllQbrActivities } from "@/lib/repositories/qbr-repository";
import { findAllMeetings, type MeetingViewer } from "@/lib/repositories/meeting-repository";

const MAX_LIST_RESULTS = 25;

/**
 * Ferramentas do Alfred: todas só leitura, todas reaproveitando repositórios
 * e serviços de análise já usados no resto da plataforma — nenhuma delas cria,
 * altera ou apaga dado nenhum.
 */
export const ALFRED_TOOLS: AlfredToolDefinition[] = [
  {
    name: "search_customers",
    description:
      "Busca clientes da carteira por nome, CS responsável, categoria ou status de saúde. Use para localizar um cliente específico ou listar um subconjunto da carteira.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Texto livre: nome da empresa, serviço ou responsável" },
        csOwner: { type: "string", description: "Nome exato do CS responsável" },
        healthStatus: { type: "string", enum: ["Saudável", "Atenção", "Crítico", "Não avaliado"] },
        category: { type: "string", enum: ["AA", "A", "B", "C", "D", "E"] },
      },
    },
  },
  {
    name: "get_customer_detail",
    description: "Retorna a ficha completa de um cliente a partir do nome (ou parte do nome) da empresa.",
    inputSchema: {
      type: "object",
      properties: { companyName: { type: "string", description: "Nome (ou parte do nome) da empresa" } },
      required: ["companyName"],
    },
  },
  {
    name: "list_overdue_contacts",
    description: "Lista clientes com o próximo contato já vencido (em atraso), do mais crítico ao menos.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_upcoming_renewals",
    description: "Lista contratos que vencem nos próximos N dias (padrão 90), do mais urgente ao menos.",
    inputSchema: {
      type: "object",
      properties: { withinDays: { type: "number", description: "Janela em dias (padrão 90)" } },
    },
  },
  {
    name: "list_no_contact_customers",
    description: "Lista clientes sem contato há mais de 20 dias, do mais tempo sem contato ao menos.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_nps_summary",
    description: "Retorna o NPS atual da carteira (score, promotores/neutros/detratores) e as respostas mais recentes.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_qbr_activities",
    description:
      "Lista atividades de QBR/SBR (plano de ação vindo do Notion), opcionalmente filtradas por cliente ou só as em atraso.",
    inputSchema: {
      type: "object",
      properties: {
        cliente: { type: "string", description: "Nome do cliente" },
        overdueOnly: { type: "boolean", description: "Só atividades em atraso" },
      },
    },
  },
  {
    name: "list_recent_meetings",
    description:
      "Lista as reuniões mais recentes sincronizadas do Read.ai, com resumo e métricas. Respeita a mesma regra de visibilidade por CS da aba Reuniões — um CS comum só vê as próprias reuniões.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number", description: "Quantidade máxima de reuniões (padrão 10)" } },
    },
  },
];

export interface AlfredToolContext {
  viewer: MeetingViewer;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function summarizeCustomer(customer: Awaited<ReturnType<typeof findAllCustomersForAnalytics>>[number]) {
  return {
    id: customer.id,
    companyName: customer.companyName,
    csOwner: customer.csOwner,
    category: customer.category,
    healthScore: customer.healthScore,
    healthStatus: customer.healthStatus,
    lastContact: customer.lastContact,
    nextContact: customer.nextContact,
    renewalDate: customer.renewalDate,
    expansionPlan: customer.expansionPlan,
    services: customer.services.map((service) => service.name),
  };
}

export async function executeAlfredTool(
  name: string,
  input: Record<string, unknown>,
  context: AlfredToolContext,
): Promise<unknown> {
  const now = new Date();

  switch (name) {
    case "search_customers": {
      const filters: CustomerFilters = {
        search: asString(input.search),
        csOwner: asString(input.csOwner),
        category: asString(input.category) as CustomerFilters["category"],
        healthStatus: asString(input.healthStatus) as CustomerFilters["healthStatus"],
      };
      const customers = await findAllCustomersForAnalytics(filters);
      return { total: customers.length, customers: customers.slice(0, MAX_LIST_RESULTS).map(summarizeCustomer) };
    }

    case "get_customer_detail": {
      const query = asString(input.companyName);
      if (!query) return { error: "Informe o nome da empresa." };

      const customers = await findAllCustomersForAnalytics({ search: query });
      if (customers.length === 0) return { error: `Nenhum cliente encontrado para "${query}".` };
      if (customers.length > 1) {
        return { ambiguous: true, matches: customers.slice(0, MAX_LIST_RESULTS).map((c) => c.companyName) };
      }
      return customers[0];
    }

    case "list_overdue_contacts": {
      const customers = await findAllCustomersForAnalytics({});
      return getOverdueContacts(customers, now).slice(0, MAX_LIST_RESULTS);
    }

    case "list_upcoming_renewals": {
      const customers = await findAllCustomersForAnalytics({});
      const withinDays = asNumber(input.withinDays) ?? 90;
      return getUpcomingRenewals(customers, now, withinDays).slice(0, MAX_LIST_RESULTS);
    }

    case "list_no_contact_customers": {
      const customers = await findAllCustomersForAnalytics({});
      return getTopNoContactCustomers(customers, now).slice(0, MAX_LIST_RESULTS);
    }

    case "get_nps_summary": {
      const responses = await findAllNpsResponses();
      return { summary: computeNpsSummary(responses), recentResponses: responses.slice(0, 10) };
    }

    case "list_qbr_activities": {
      const cliente = asString(input.cliente);
      const activities = await findAllQbrActivities({
        search: undefined,
        clientes: cliente ? [cliente] : undefined,
        teams: undefined,
        status: undefined,
        overdueOnly: asBoolean(input.overdueOnly) ?? false,
      });
      return activities.slice(0, MAX_LIST_RESULTS);
    }

    case "list_recent_meetings": {
      const meetings = await findAllMeetings(context.viewer);
      const limit = Math.min(asNumber(input.limit) ?? 10, MAX_LIST_RESULTS);
      return meetings.slice(0, limit);
    }

    default:
      throw new AppError(`Ferramenta desconhecida: ${name}`, 400, "UNKNOWN_TOOL");
  }
}
