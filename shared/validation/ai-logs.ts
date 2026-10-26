// import { z } from "zod";

// const dateOnlySchema = z
//   .string()
//   .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for dates.")
//   .refine((value) => {
//     const parsed = new Date(`${value}T00:00:00.000Z`);
//     return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
//   }, "Invalid calendar date.");

// const dateFilterSchema = z.union([dateOnlySchema, z.literal("")]).default("");
// export const aiLogsFilterSchema = z
//   .object({
//     from: dateFilterSchema,
//     to: dateFilterSchema,
//     operation: z.enum(["SUGGESTIONS", "PROJECT_EXTRACTION"]).or(z.literal("")).default(""),
//     status: z.enum(["RUNNING", "SUCCEEDED", "FAILED"]).or(z.literal("")).default(""),
//     level: z.enum(["INFO", "WARN", "ERROR"]).or(z.literal("")).default(""),
//     provider: z.enum(["OPENROUTER", "LOCAL"]).or(z.literal("")).default(""),
//     query: z.string().trim().max(100).default(""),
//     page: z.coerce.number().int().min(1).max(100_000).default(1),
//   })
//   .superRefine((filters, context) => {
//     if (filters.from && filters.to && filters.from > filters.to) {
//       context.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ["to"],
//         message: "The end date must be on or after the start date.",
//       });
//     }
//   });

// export type AiLogsFilters = z.infer<typeof aiLogsFilterSchema>;
// export type AiLogsFilterInput = z.input<typeof aiLogsFilterSchema>;

import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for dates.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Invalid calendar date.");

const dateFilterSchema = z.union([dateOnlySchema, z.literal("")]).default("");
export const aiLogsFilterSchema = z
  .object({
    from: dateFilterSchema,
    to: dateFilterSchema,
    operation: z.enum(["SUGGESTIONS", "PROJECT_EXTRACTION"]).or(z.literal("")).default(""),
    status: z.enum(["RUNNING", "SUCCEEDED", "FAILED"]).or(z.literal("")).default(""),
    level: z.enum(["INFO", "WARN", "ERROR"]).or(z.literal("")).default(""),
    provider: z.enum(["OPENROUTER", "LOCAL"]).or(z.literal("")).default(""),
    query: z.string().trim().max(100).default(""),
    page: z.coerce.number().int().min(1).max(100_000).default(1),
  })
  .superRefine((filters, context) => {
    if (filters.from && filters.to && filters.from > filters.to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "The end date must be on or after the start date.",
      });
    }
  });

export type AiLogsFilters = z.infer<typeof aiLogsFilterSchema>;
export type AiLogsFilterInput = z.input<typeof aiLogsFilterSchema>;
