import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/errors";
import type { ObservationInput } from "@/lib/validations/observation";
import type { ObservationDTO } from "@/lib/types";

export async function addObservation(customerId: string, input: ObservationInput): Promise<ObservationDTO> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new NotFoundError("Cliente não encontrado.");
  }

  const observation = await prisma.observation.create({
    data: { customerId, text: input.text, author: input.author },
  });

  return {
    id: observation.id,
    customerId: observation.customerId,
    text: observation.text,
    author: observation.author,
    createdAt: observation.createdAt.toISOString(),
  };
}
