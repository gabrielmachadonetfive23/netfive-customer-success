import { z } from "zod";
import { ALLOWED_CATEGORIES, HEALTH_STATUSES } from "@/lib/constants";

const optionalTrimmedString = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const optionalUrl = z
  .string()
  .trim()
  .url("Informe uma URL válida (ex.: https://exemplo.com).")
  .max(2048)
  .optional()
  .or(z.literal(""))
  .transform((value) => (value === "" ? undefined : value));

const optionalIsoDate = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || !Number.isNaN(Date.parse(value)), {
    message: "Data inválida.",
  });

export const customerInputSchema = z.object({
  companyName: z.string().trim().min(1, "Informe o nome da empresa.").max(200),
  csOwner: z.string().trim().min(1, "Informe o CS responsável.").max(200),
  category: z.enum(ALLOWED_CATEGORIES, { errorMap: () => ({ message: "Categoria inválida." }) }),

  segment: optionalTrimmedString,
  segmentSourceTitle: optionalTrimmedString,
  segmentSourceUrl: optionalUrl,
  segmentVerifiedAt: optionalIsoDate,

  contactName: optionalTrimmedString,
  contactRole: optionalTrimmedString,
  contactInfo: optionalTrimmedString,
  technicalOwner: optionalTrimmedString,

  startDate: optionalIsoDate,
  renewalDate: optionalIsoDate,

  healthScore: z
    .union([z.number(), z.nan()])
    .optional()
    .nullable()
    .refine((value) => value === undefined || value === null || Number.isNaN(value) === false, {
      message: "Health Score deve ser um número.",
    })
    .refine((value) => value == null || (value >= 0 && value <= 100), {
      message: "Health Score deve estar entre 0 e 100.",
    })
    .transform((value) => (value == null || Number.isNaN(value) ? null : Math.round(value))),
  healthStatus: z.enum(HEALTH_STATUSES).default("Não avaliado"),
  healthReason: optionalTrimmedString,
  attentionPoints: optionalTrimmedString,
  actionPlan: optionalTrimmedString,

  lastContact: optionalIsoDate,
  nextContact: optionalIsoDate,
  lastVisit: optionalIsoDate,
  nextVisit: optionalIsoDate,

  needs: optionalTrimmedString,
  currentPerception: optionalTrimmedString,
  expansionPlan: optionalTrimmedString,
  growthEstimate: optionalTrimmedString,
  opportunities: optionalTrimmedString,
  expansionNextStep: optionalTrimmedString,

  annualRevenue: z
    .union([z.number(), z.nan()])
    .optional()
    .nullable()
    .refine((value) => value == null || Number.isNaN(value) || value > 0, {
      message: "Faturamento deve ser maior que zero. Deixe em branco quando não houver dado público.",
    })
    .transform((value) => (value == null || Number.isNaN(value) ? null : value)),
  fiscalYear: z
    .union([z.number(), z.nan()])
    .optional()
    .nullable()
    .transform((value) => (value == null || Number.isNaN(value) ? null : Math.round(value))),
  revenueMetric: optionalTrimmedString,
  revenuePeriod: optionalTrimmedString,
  revenueSourceTitle: optionalTrimmedString,
  revenueSourceUrl: optionalUrl,
  revenueVerifiedAt: optionalIsoDate,

  serviceIds: z.array(z.string().uuid()).default([]),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

export const customerListQuerySchema = z.object({
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
  sortBy: z
    .enum(["companyName", "csOwner", "category", "segment", "healthScore", "annualRevenue", "lastContact", "nextContact"])
    .optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
