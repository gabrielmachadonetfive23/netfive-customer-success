import { z } from "zod";

const commaListToArray = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : undefined));

export const qbrFiltersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  // Enviados como lista separada por vírgula — atividade casa se tiver QUALQUER um dos valores.
  clientes: commaListToArray,
  teams: commaListToArray,
  status: z.string().trim().max(100).optional(),
  overdueOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type QbrFiltersQuery = z.infer<typeof qbrFiltersSchema>;
