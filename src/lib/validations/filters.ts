import { z } from "zod";
import { ALLOWED_CATEGORIES, HEALTH_STATUSES } from "@/lib/constants";

export const customerFiltersSchema = z.object({
  search: z.string().trim().max(200).optional(),
  csOwner: z.string().trim().max(200).optional(),
  category: z.enum(ALLOWED_CATEGORIES).optional(),
  healthStatus: z.enum(HEALTH_STATUSES).optional(),
});

export type CustomerFiltersQuery = z.infer<typeof customerFiltersSchema>;
