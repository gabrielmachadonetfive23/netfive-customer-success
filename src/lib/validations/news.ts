import { z } from "zod";
import { NEWS_CATEGORIES } from "@/lib/services/news-classification";

export const newsListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.enum(NEWS_CATEGORIES).optional(),
  // Enviado como lista separada por vírgula (ex.: "Agronegócio,Energia") — notícia casa se tiver QUALQUER um dos segmentos.
  segments: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type NewsListQuery = z.infer<typeof newsListQuerySchema>;
