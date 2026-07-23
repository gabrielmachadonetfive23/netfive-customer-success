import { prisma } from "@/lib/db";
import type { ServiceOption } from "@/lib/types";

export async function listServices(): Promise<ServiceOption[]> {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } });
  return services.map((service) => ({ id: service.id, name: service.name, active: service.active }));
}
