import { z } from "zod";
import { ALLOWED_CATEGORIES, HEALTH_STATUSES } from "@/lib/constants";

export const customerFiltersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  csOwner: z.string().trim().max(200).optional(),
  category: z.enum(ALLOWED_CATEGORIES).optional(),
  healthStatus: z.enum(HEALTH_STATUSES).optional(),
  // Enviado como lista separada por vírgula (ex.: "id1,id2") — cliente casa se tiver QUALQUER um dos serviços.
  serviceIds: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : undefined)),
});

export type CustomerFiltersQuery = z.infer<typeof customerFiltersSchema>;
