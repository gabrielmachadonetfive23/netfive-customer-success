import type { QbrActivity, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { QbrActivityDTO } from "@/lib/types";
import type { QbrFiltersQuery } from "@/lib/validations/qbr";

function mapQbrToDTO(activity: QbrActivity): QbrActivityDTO {
  return {
    id: activity.id,
    notionUrl: activity.notionUrl,
    activity: activity.activity,
    cliente: activity.cliente,
    team: activity.team,
    responsavel: activity.responsavel,
    status: activity.status,
    tipo: activity.tipo,
    quarter: activity.quarter,
    overdue: activity.overdue,
    agidesk: activity.agidesk,
    dueDate: activity.dueDate ? activity.dueDate.toISOString() : null,
    lastSyncedAt: activity.lastSyncedAt.toISOString(),
  };
}

/** Lista completa (sem paginação — dataset pequeno, algumas centenas de linhas) das atividades QBR/SBR que casam com os filtros. */
export async function findAllQbrActivities(filters: QbrFiltersQuery): Promise<QbrActivityDTO[]> {
  const where: Prisma.QbrActivityWhereInput = {};

  if (filters.search) {
    where.OR = [
      { activity: { contains: filters.search, mode: "insensitive" } },
      { cliente: { contains: filters.search, mode: "insensitive" } },
      { agidesk: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.clientes && filters.clientes.length > 0) where.cliente = { in: filters.clientes };
  if (filters.teams && filters.teams.length > 0) where.team = { in: filters.teams };
  if (filters.status) where.status = filters.status;
  if (filters.overdueOnly) where.overdue = true;

  const activities = await prisma.qbrActivity.findMany({
    where,
    orderBy: [{ cliente: "asc" }, { dueDate: "asc" }],
  });

  return activities.map(mapQbrToDTO);
}

/** Valores distintos de Cliente/Time/Status já sincronizados, para popular os filtros do lado do cliente. */
export async function findQbrFilterOptions(): Promise<{ clientes: string[]; teams: string[]; statuses: string[] }> {
  const activities = await prisma.qbrActivity.findMany({ select: { cliente: true, team: true, status: true } });

  const clientes = new Set<string>();
  const teams = new Set<string>();
  const statuses = new Set<string>();
  for (const activity of activities) {
    if (activity.cliente) clientes.add(activity.cliente);
    if (activity.team) teams.add(activity.team);
    if (activity.status) statuses.add(activity.status);
  }

  return {
    clientes: Array.from(clientes).sort((a, b) => a.localeCompare(b)),
    teams: Array.from(teams).sort((a, b) => a.localeCompare(b)),
    statuses: Array.from(statuses).sort((a, b) => a.localeCompare(b)),
  };
}
