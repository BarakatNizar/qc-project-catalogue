import { Language } from "@prisma/client";
import { z } from "zod";

export const extractedProjectResponseSchema = z.object({
  language: z.enum(Language),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  description: z.string().trim().min(1),
  problemStatement: z.string().trim().nullable().optional(),
  proposedSolution: z.string().trim().nullable().optional(),
  objectives: z.string().trim().nullable().optional(),
  targetUsers: z.string().trim().nullable().optional(),
  availableResources: z.string().trim().nullable().optional(),
  constraints: z.string().trim().nullable().optional(),
  projectSupervisorName: z.string().trim().min(1).nullable().optional(),
  studentsPresented:z.string().trim().min(1).optional(),
  yearPresentation: z.string().max(6).optional(),
  projectType: z.enum([
    "Pre-Graduation", 
    "Pre Graduation", 
    "pre-graduation", 
    "pre graduation", 
    "Graduation", 
    "graduation"
  ]).default("Graduation"),
  inScopeFeatures: z.array(z.object({ content: z.string().trim().min(1) })),
  outScopeFeatures: z.array(z.object({ content: z.string().trim().min(1) })),
  technologies: z.array(z.object({ content: z.string().trim().min(1) })),
});

export type ExtractedProjectPayload = z.infer<typeof extractedProjectResponseSchema>;
