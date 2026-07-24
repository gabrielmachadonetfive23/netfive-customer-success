import { prisma } from "@/lib/db";
import type { CustomerDTO } from "@/lib/types";
import { ALLOWED_CATEGORIES, DEFAULT_HEALTH_STATUS, HEALTH_STATUSES, normalizeServiceName } from "@/lib/constants";
import * as smartsheetClient from "@/lib/integrations/smartsheet/client";
import * as smartsheetMapper from "@/lib/integrations/smartsheet/mapper";
import * as pipedriveClient from "@/lib/integrations/pipedrive/client";
import * as pipedriveMapper from "@/lib/integrations/pipedrive/mapper";
import type { SyncProvider } from "@/lib/integrations/types";
import { findCustomerDetailById } from "@/lib/repositories/customer-repository";

/** Interpreta o texto de serviços vindo do provedor de acordo com suas regras de formatação. */
function parseServiceNames(provider: SyncProvider, raw: string | number | null): string[] {
  if (raw === null || raw === undefined || raw === "") return [];
  if (provider === "smartsheet") {
    return smartsheetMapper.parseSmartsheetMultiValue(raw);
  }
  return String(raw)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Garante que os serviços existam (cria como inativos os que não estiverem no catálogo) e retorna os IDs. */
async function resolveServiceIds(rawNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const rawName of rawNames) {
    const name = normalizeServiceName(rawName);
    const service = await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name, active: false },
    });
    ids.push(service.id);
  }
  return ids;
}

async function replaceCustomerServices(customerId: string, serviceIds: string[]): Promise<void> {
  await prisma.customerService.deleteMany({ where: { customerId } });
  if (serviceIds.length > 0) {
    await prisma.customerService.createMany({
      data: serviceIds.map((serviceId) => ({ customerId, serviceId })),
    });
  }
}

function integrationsEnabled(provider: SyncProvider): boolean {
  if (provider === "smartsheet") {
    return Boolean(process.env.SMARTSHEET_API_TOKEN && process.env.SMARTSHEET_SHEET_ID);
  }
  return Boolean(process.env.PIPEDRIVE_API_TOKEN && process.env.PIPEDRIVE_DOMAIN);
}

async function logSync(params: {
  provider: SyncProvider;
  direction: "push" | "pull";
  customerId?: string;
  status: "success" | "error" | "skipped";
  message?: string;
}): Promise<void> {
  await prisma.syncLog.create({ data: params }).catch(() => {
    /* nunca deixamos uma falha de log quebrar o fluxo principal */
  });
}

/** Envia o cliente para um provedor específico, criando ou atualizando o registro externo vinculado. */
async function pushToProvider(customer: CustomerDTO, provider: SyncProvider): Promise<void> {
  if (!integrationsEnabled(provider)) {
    await logSync({ provider, direction: "push", customerId: customer.id, status: "skipped", message: "Integração não configurada." });
    return;
  }

  try {
    const link = await prisma.externalLink.findUnique({
      where: { customerId_provider: { customerId: customer.id, provider } },
    });

    let externalId = link?.externalId;
    let externalUpdatedAt: Date;

    if (provider === "smartsheet") {
      const cells = await smartsheetMapper.customerToSmartsheetCells(customer);
      const row = externalId
        ? await smartsheetClient.updateRow(externalId, cells)
        : await smartsheetClient.createRow(cells);
      externalId = String(row.id);
      externalUpdatedAt = new Date(row.modifiedAt);
    } else {
      const fields = await pipedriveMapper.customerToPipedriveFields(customer);
      const organization = externalId
        ? await pipedriveClient.updateOrganization(externalId, fields)
        : await pipedriveClient.createOrganization(fields);
      externalId = String(organization.id);
      externalUpdatedAt = new Date(organization.update_time);
    }

    await prisma.externalLink.upsert({
      where: { customerId_provider: { customerId: customer.id, provider } },
      create: {
        customerId: customer.id,
        provider,
        externalId,
        externalUpdatedAt,
        lastSyncDirection: "push",
      },
      update: { externalId, externalUpdatedAt, lastSyncDirection: "push", lastSyncedAt: new Date() },
    });

    await logSync({ provider, direction: "push", customerId: customer.id, status: "success" });
  } catch (error) {
    await logSync({
      provider,
      direction: "push",
      customerId: customer.id,
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Propaga a criação/edição de um cliente para Smartsheet e Pipedrive. Nunca lança — falhas são registradas em SyncLog. */
export async function pushCustomerToAllProviders(customer: CustomerDTO, skip?: SyncProvider): Promise<void> {
  const providers: SyncProvider[] = (["smartsheet", "pipedrive"] as const).filter((p) => p !== skip);
  await Promise.all(providers.map((provider) => pushToProvider(customer, provider)));
}

function coerceCategory(value: unknown): CustomerDTO["category"] | undefined {
  const category = ALLOWED_CATEGORIES.find((c) => c === value);
  return category;
}

function coerceHealthStatus(value: unknown): CustomerDTO["healthStatus"] {
  const status = HEALTH_STATUSES.find((s) => s === value);
  return status ?? DEFAULT_HEALTH_STATUS;
}

function coerceDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function coerceText(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

/**
 * Aplica valores vindos de um provedor externo a um cliente já existente,
 * respeitando a regra de "última alteração vence": se o cliente local foi
 * modificado depois do timestamp externo, a alteração externa é descartada e
 * o dado local é reenviado para corrigir o sistema externo.
 */
export async function applyIncomingChange(params: {
  provider: SyncProvider;
  externalId: string;
  externalUpdatedAt: Date;
  values: Partial<Record<string, string | number | null>>;
}): Promise<void> {
  const { provider, externalId, externalUpdatedAt, values } = params;

  const link = await prisma.externalLink.findUnique({
    where: { provider_externalId: { provider, externalId } },
    include: { customer: true },
  });

  if (!link) {
    await createCustomerFromExternal(provider, externalId, externalUpdatedAt, values);
    return;
  }

  const localCustomer = link.customer;

  if (localCustomer.updatedAt.getTime() >= externalUpdatedAt.getTime()) {
    // Alteração local é mais recente (ou simultânea): local vence. Reenvia para corrigir o externo.
    await logSync({
      provider,
      direction: "pull",
      customerId: localCustomer.id,
      status: "skipped",
      message: "Registro local mais recente; alteração externa descartada e reenviado o dado local.",
    });
    const detail = await findCustomerDetailById(localCustomer.id);
    await pushToProvider(detail, provider);
    return;
  }

  const data: Record<string, unknown> = {};
  if (values.companyName !== undefined) data.companyName = coerceText(values.companyName) ?? localCustomer.companyName;
  if (values.csOwner !== undefined) data.csOwner = coerceText(values.csOwner) ?? localCustomer.csOwner;
  if (values.category !== undefined) data.category = coerceCategory(values.category) ?? localCustomer.category;
  if (values.segment !== undefined) data.segment = coerceText(values.segment);
  if (values.healthScore !== undefined) data.healthScore = coerceNumber(values.healthScore);
  if (values.healthStatus !== undefined) data.healthStatus = coerceHealthStatus(values.healthStatus);
  if (values.healthReason !== undefined) data.healthReason = coerceText(values.healthReason);
  if (values.attentionPoints !== undefined) data.attentionPoints = coerceText(values.attentionPoints);
  if (values.actionPlan !== undefined) data.actionPlan = coerceText(values.actionPlan);
  if (values.lastContact !== undefined) data.lastContact = coerceDate(values.lastContact);
  if (values.nextContact !== undefined) data.nextContact = coerceDate(values.nextContact);
  if (values.lastVisit !== undefined) data.lastVisit = coerceDate(values.lastVisit);
  if (values.nextVisit !== undefined) data.nextVisit = coerceDate(values.nextVisit);
  if (values.needs !== undefined) data.needs = coerceText(values.needs);
  if (values.currentPerception !== undefined) data.currentPerception = coerceText(values.currentPerception);
  if (values.expansionPlan !== undefined) data.expansionPlan = coerceText(values.expansionPlan);
  if (values.growthEstimate !== undefined) data.growthEstimate = coerceText(values.growthEstimate);
  if (values.opportunities !== undefined) data.opportunities = coerceText(values.opportunities);
  if (values.expansionNextStep !== undefined) data.expansionNextStep = coerceText(values.expansionNextStep);
  if (values.annualRevenue !== undefined) data.annualRevenue = coerceNumber(values.annualRevenue);
  if (values.fiscalYear !== undefined) data.fiscalYear = coerceNumber(values.fiscalYear);
  if (values.revenueMetric !== undefined) data.revenueMetric = coerceText(values.revenueMetric);
  if (values.revenuePeriod !== undefined) data.revenuePeriod = coerceText(values.revenuePeriod);

  await prisma.customer.update({ where: { id: localCustomer.id }, data });

  if (values.services !== undefined) {
    const serviceIds = await resolveServiceIds(parseServiceNames(provider, values.services));
    await replaceCustomerServices(localCustomer.id, serviceIds);
  }

  await prisma.externalLink.update({
    where: { customerId_provider: { customerId: localCustomer.id, provider } },
    data: { externalUpdatedAt, lastSyncDirection: "pull", lastSyncedAt: new Date() },
  });

  await logSync({ provider, direction: "pull", customerId: localCustomer.id, status: "success" });

  const otherProvider: SyncProvider = provider === "smartsheet" ? "pipedrive" : "smartsheet";
  const refreshed = await findCustomerDetailById(localCustomer.id);
  await pushToProvider(refreshed, otherProvider);
}

async function createCustomerFromExternal(
  provider: SyncProvider,
  externalId: string,
  externalUpdatedAt: Date,
  values: Partial<Record<string, string | number | null>>,
): Promise<void> {
  const companyName = coerceText(values.companyName);
  const csOwner = coerceText(values.csOwner);
  const category = coerceCategory(values.category);

  if (!companyName || !csOwner || !category) {
    await logSync({
      provider,
      direction: "pull",
      status: "skipped",
      message: `Registro externo ${externalId} sem os campos obrigatórios (empresa, CS responsável, categoria) — ignorado.`,
    });
    return;
  }

  const customer = await prisma.customer.create({
    data: { companyName, csOwner, category, healthStatus: DEFAULT_HEALTH_STATUS },
  });

  if (values.services !== undefined) {
    const serviceIds = await resolveServiceIds(parseServiceNames(provider, values.services));
    await replaceCustomerServices(customer.id, serviceIds);
  }

  await prisma.externalLink.create({
    data: {
      customerId: customer.id,
      provider,
      externalId,
      externalUpdatedAt,
      lastSyncDirection: "pull",
    },
  });

  await logSync({ provider, direction: "pull", customerId: customer.id, status: "success", message: "Cliente criado a partir de registro externo." });

  const otherProvider: SyncProvider = provider === "smartsheet" ? "pipedrive" : "smartsheet";
  const created = await findCustomerDetailById(customer.id);
  await pushToProvider(created, otherProvider);
}
