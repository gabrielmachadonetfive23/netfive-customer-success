import type { NpsCategory, NpsResponseDTO, NpsSummary } from "@/lib/types";

/** Classificação padrão de NPS: 0-6 Detrator, 7-8 Neutro, 9-10 Promotor. */
export function npsCategoryForScore(score: number): NpsCategory {
  if (score >= 9) return "Promotor";
  if (score >= 7) return "Neutro";
  return "Detrator";
}

/** NPS = % promotores - % detratores, entre as respostas que já têm nota lançada. */
export function computeNpsSummary(responses: NpsResponseDTO[]): NpsSummary {
  const scored = responses.filter((r): r is NpsResponseDTO & { score: number } => r.score !== null);

  const promoters = scored.filter((r) => r.category === "Promotor").length;
  const passives = scored.filter((r) => r.category === "Neutro").length;
  const detractors = scored.filter((r) => r.category === "Detrator").length;

  const score = scored.length > 0 ? Math.round(((promoters - detractors) / scored.length) * 100) : null;

  return {
    score,
    promoters,
    passives,
    detractors,
    scoredCount: scored.length,
    totalParticipants: responses.length,
  };
}
