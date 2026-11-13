import { Language } from "@prisma/client";
import { z } from "zod";

export const extractedProjectResponseSchema = z.object({
  language: z.enum(Language, "Select a valid project language."),
  title: z
    .string("Project title is required.").trim()
    .min(1, "Project title cannot be empty."),
  summary: z
    .string("Project summary is required.").trim()
    .min(1, "Project summary cannot be empty."),
  description: z
    .string("Project description is required.").trim()
    .min(1, "Project description cannot be empty."),
  problemStatement: z.string().trim().nullable().optional(),
  proposedSolution: z.string().trim().nullable().optional(),
  objectives: z.string().trim().nullable().optional(),
  targetUsers: z.string().trim().nullable().optional(),
  availableResources: z.string().trim().nullable().optional(),
  constraints: z.string().trim().nullable().optional(),
  projectSupervisorName: z
    .string()
    .trim()
    .min(1, "Supervisor name cannot be empty.")
    .nullable()
    .optional(),
  studentsPresented: z
    .string()
    .trim()
    .min(1, "Students presented field cannot be empty.")
    .optional(),
  yearPresentation: z
    .string()
    .max(6, "Presentation year must not exceed 6 characters.")
    .optional(),
  projectType: z
    .enum(
      [
        "Pre-Graduation",
        "Pre Graduation",
        "pre-graduation",
        "pre graduation",
        "Graduation",
        "graduation",
      ],
      "Select a valid project type."
    )
    .default("Graduation"),
  inScopeFeatures: z.array(
    z.object({
      content: z
        .string("Feature content is required.").trim()
        .min(1, "Feature content cannot be empty."),
    })
  ),
  outScopeFeatures: z.array(
    z.object({
      content: z
        .string("Feature content is required.").trim()
        .min(1, "Feature content cannot be empty."),
    })
  ),
  technologies: z.array(
    z.object({
      content: z
        .string("Technology content is required.").trim()
        .min(1, "Technology content cannot be empty."),
    })
  ),
});

export type ExtractedProjectPayload = z.infer<typeof extractedProjectResponseSchema>;