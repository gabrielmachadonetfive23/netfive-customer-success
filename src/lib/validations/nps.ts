import { z } from "zod";

const optionalIsoDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), {
    message: "Data inválida.",
  });

const optionalTrimmedString = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const npsResponseInputSchema = z.object({
  companyName: z.string().trim().min(1, "Informe o nome da empresa.").max(200),
  score: z
    .union([z.number(), z.nan()])
    .optional()
    .nullable()
    .refine((value) => value == null || Number.isNaN(value) || (Number.isInteger(value) && value >= 0 && value <= 10), {
      message: "A nota do NPS deve ser um número inteiro entre 0 e 10.",
    })
    .transform((value) => (value == null || Number.isNaN(value) ? null : value)),
  respondedAt: optionalIsoDate,
  notes: optionalTrimmedString,
});

export type NpsResponseInput = z.infer<typeof npsResponseInputSchema>;
