import type { Customer, CustomerService, Observation, Service, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CustomerDTO, CustomerDetailDTO, CustomerFilters, PaginatedResult } from "@/lib/types";
import type { CustomerInput, CustomerListQuery } from "@/lib/validations/customer";
import type { Category, HealthStatus } from "@/lib/constants";
import { NotFoundError } from "@/lib/api/errors";

type CustomerWithServices = Customer & {
  services: (CustomerService & { service: Service })[];
};

function toIsoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

export function mapCustomerToDTO(customer: CustomerWithServices): CustomerDTO {
  return {
    id: customer.id,
    companyName: customer.companyName,
    csOwner: customer.csOwner,
    category: customer.category as Category,

    segment: customer.segment,
    segmentSourceTitle: customer.segmentSourceTitle,
    segmentSourceUrl: customer.segmentSourceUrl,
    segmentVerifiedAt: toIsoOrNull(customer.segmentVerifiedAt),

    contactName: customer.contactName,
    contactRole: customer.contactRole,
    contactInfo: customer.contactInfo,
    technicalOwner: customer.technicalOwner,

    startDate: toIsoOrNull(customer.startDate),
    renewalDate: toIsoOrNull(customer.renewalDate),

    healthScore: customer.healthScore,
    healthStatus: customer.healthStatus as HealthStatus,
    healthReason: customer.healthReason,
    attentionPoints: customer.attentionPoints,
    actionPlan: customer.actionPlan,

    lastContact: toIsoOrNull(customer.lastContact),
    nextContact: toIsoOrNull(customer.nextContact),
    lastVisit: toIsoOrNull(customer.lastVisit),
    nextVisit: toIsoOrNull(customer.nextVisit),

    needs: customer.needs,
    currentPerception: customer.currentPerception,
    expansionPlan: customer.expansionPlan,
    growthEstimate: customer.growthEstimate,
    opportunities: customer.opportunities,
    expansionNextStep: customer.expansionNextStep,

    annualRevenue: customer.annualRevenue,
    fiscalYear: customer.fiscalYear,
    revenueMetric: customer.revenueMetric,
    revenuePeriod: customer.revenuePeriod,
    revenueSourceTitle: customer.revenueSourceTitle,
    revenueSourceUrl: customer.revenueSourceUrl,
    revenueVerifiedAt: toIsoOrNull(customer.revenueVerifiedAt),

    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),

    services: customer.services.map((cs) => ({
      id: cs.service.id,
      name: cs.service.name,
      active: cs.service.active,
    })),
  };
}

function mapObservationToDTO(observation: Observation) {
  return {
    id: observation.id,
    customerId: observation.customerId,
    text: observation.text,
    author: observation.author,
    createdAt: observation.createdAt.toISOString(),
  };
}

const CUSTOMER_INCLUDE = {
  services: { include: { service: true } },
} satisfies Prisma.CustomerInclude;

function buildWhere(filters: CustomerFilters): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = {};

  if (filters.search) {
    const search = filters.search;
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { segment: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
      { csOwner: { contains: search, mode: "insensitive" } },
      { services: { some: { service: { name: { contains: search, mode: "insensitive" } } } } },
    ];
  }

  if (filters.csOwner) where.csOwner = filters.csOwner;
  if (filters.category) where.category = filters.category;
  if (filters.healthStatus) where.healthStatus = filters.healthStatus;

  return where;
}

/** Lista completa (sem paginação), usada para KPIs e gráficos que precisam considerar todo o conjunto filtrado. */
export async function findAllCustomersForAnalytics(filters: CustomerFilters): Promise<CustomerDTO[]> {
  const customers = await prisma.customer.findMany({
    where: buildWhere(filters),
    include: CUSTOMER_INCLUDE,
    orderBy: { companyName: "asc" },
  });
  return customers.map(mapCustomerToDTO);
}

export async function findCustomersPaginated(
  query: CustomerListQuery,
): Promise<PaginatedResult<CustomerDTO>> {
  const where = buildWhere({
    search: query.search,
    csOwner: query.csOwner,
    category: query.category,
    healthStatus: query.healthStatus,
  });

  const sortBy = query.sortBy ?? "companyName";
  const sortDir = query.sortDir ?? "asc";

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: CUSTOMER_INCLUDE,
      orderBy: { [sortBy]: sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items: customers.map(mapCustomerToDTO),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function findCustomerDetailById(id: string): Promise<CustomerDetailDTO> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      ...CUSTOMER_INCLUDE,
      observations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) {
    throw new NotFoundError("Cliente não encontrado.");
  }

  return {
    ...mapCustomerToDTO(customer),
    observations: customer.observations.map(mapObservationToDTO),
  };
}

function toCustomerData(input: CustomerInput): Omit<Prisma.CustomerUncheckedCreateInput, "services"> {
  return {
    companyName: input.companyName,
    csOwner: input.csOwner,
    category: input.category,
    segment: input.segment ?? null,
    segmentSourceTitle: input.segmentSourceTitle ?? null,
    segmentSourceUrl: input.segmentSourceUrl ?? null,
    segmentVerifiedAt: input.segmentVerifiedAt ? new Date(input.segmentVerifiedAt) : null,
    contactName: input.contactName ?? null,
    contactRole: input.contactRole ?? null,
    contactInfo: input.contactInfo ?? null,
    technicalOwner: input.technicalOwner ?? null,
    startDate: input.startDate ? new Date(input.startDate) : null,
    renewalDate: input.renewalDate ? new Date(input.renewalDate) : null,
    healthScore: input.healthScore ?? null,
    healthStatus: input.healthStatus,
    healthReason: input.healthReason ?? null,
    attentionPoints: input.attentionPoints ?? null,
    actionPlan: input.actionPlan ?? null,
    lastContact: input.lastContact ? new Date(input.lastContact) : null,
    nextContact: input.nextContact ? new Date(input.nextContact) : null,
    lastVisit: input.lastVisit ? new Date(input.lastVisit) : null,
    nextVisit: input.nextVisit ? new Date(input.nextVisit) : null,
    needs: input.needs ?? null,
    currentPerception: input.currentPerception ?? null,
    expansionPlan: input.expansionPlan ?? null,
    growthEstimate: input.growthEstimate ?? null,
    opportunities: input.opportunities ?? null,
    expansionNextStep: input.expansionNextStep ?? null,
    annualRevenue: input.annualRevenue ?? null,
    fiscalYear: input.fiscalYear ?? null,
    revenueMetric: input.revenueMetric ?? null,
    revenuePeriod: input.revenuePeriod ?? null,
    revenueSourceTitle: input.revenueSourceTitle ?? null,
    revenueSourceUrl: input.revenueSourceUrl ?? null,
    revenueVerifiedAt: input.revenueVerifiedAt ? new Date(input.revenueVerifiedAt) : null,
  };
}

export async function createCustomer(input: CustomerInput): Promise<CustomerDetailDTO> {
  const data = toCustomerData(input);

  const created = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({ data });
    if (input.serviceIds.length > 0) {
      await tx.customerService.createMany({
        data: input.serviceIds.map((serviceId) => ({ customerId: customer.id, serviceId })),
      });
    }
    return customer.id;
  });

  return findCustomerDetailById(created);
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<CustomerDetailDTO> {
  const data = toCustomerData(input);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Cliente não encontrado.");
    }

    await tx.customer.update({ where: { id }, data });
    await tx.customerService.deleteMany({ where: { customerId: id } });
    if (input.serviceIds.length > 0) {
      await tx.customerService.createMany({
        data: input.serviceIds.map((serviceId) => ({ customerId: id, serviceId })),
      });
    }
  });

  return findCustomerDetailById(id);
}

export async function deleteCustomer(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Cliente não encontrado.");
    }
    await tx.observation.deleteMany({ where: { customerId: id } });
    await tx.customerService.deleteMany({ where: { customerId: id } });
    await tx.customer.delete({ where: { id } });
  });
}
