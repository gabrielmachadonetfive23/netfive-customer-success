import { z } from "zod";

export const observationInputSchema = z.object({
  text: z.string().trim().min(1, "Escreva uma observação.").max(4000),
  author: z.string().trim().min(1, "Informe o autor.").max(200),
});

export type ObservationInput = z.infer<typeof observationInputSchema>;
