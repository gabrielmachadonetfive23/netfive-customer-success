import { prisma } from "@/lib/db";

export type AuditAction =
  | "customer.create"
  | "customer.update"
  | "customer.delete"
  | "observation.create";

export async function recordAuditLog(params: {
  action: AuditAction;
  entityId: string;
  actor: string;
  detail?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entityId: params.entityId,
      actor: params.actor,
      detail: params.detail,
    },
  });
}
