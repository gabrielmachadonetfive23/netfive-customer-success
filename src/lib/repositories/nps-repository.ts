import type { NpsResponse } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api/errors";
import { npsCategoryForScore } from "@/lib/services/nps-analytics";
import type { NpsResponseDTO } from "@/lib/types";
import type { NpsResponseInput } from "@/lib/validations/nps";

function mapNpsToDTO(response: NpsResponse): NpsResponseDTO {
  return {
    id: response.id,
    companyName: response.companyName,
    score: response.score,
    category: response.score !== null ? npsCategoryForScore(response.score) : null,
    respondedAt: response.respondedAt ? response.respondedAt.toISOString() : null,
    notes: response.notes,
    createdAt: response.createdAt.toISOString(),
    updatedAt: response.updatedAt.toISOString(),
  };
}

export async function findAllNpsResponses(): Promise<NpsResponseDTO[]> {
  const responses = await prisma.npsResponse.findMany({
    orderBy: [{ respondedAt: "desc" }, { companyName: "asc" }],
  });
  return responses.map(mapNpsToDTO);
}

function toNpsData(input: NpsResponseInput) {
  return {
    companyName: input.companyName,
    score: input.score ?? null,
    respondedAt: input.respondedAt ? new Date(input.respondedAt) : null,
    notes: input.notes ?? null,
  };
}

export async function createNpsResponse(input: NpsResponseInput): Promise<NpsResponseDTO> {
  const created = await prisma.npsResponse.create({ data: toNpsData(input) });
  return mapNpsToDTO(created);
}

export async function updateNpsResponse(id: string, input: NpsResponseInput): Promise<NpsResponseDTO> {
  const existing = await prisma.npsResponse.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Resposta de NPS não encontrada.");
  }
  const updated = await prisma.npsResponse.update({ where: { id }, data: toNpsData(input) });
  return mapNpsToDTO(updated);
}

export async function deleteNpsResponse(id: string): Promise<void> {
  const existing = await prisma.npsResponse.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Resposta de NPS não encontrada.");
  }
  await prisma.npsResponse.delete({ where: { id } });
}
