
import { z } from "zod";
export type ValidationResult = { ok: true } | { ok: false; reason: string };


const projectIdSchema = z.uuid(
  "Invalid project ID format.",
);


export function checkProjectId_Schema(id:string): ValidationResult {
const parsed = projectIdSchema.safeParse(id);
if (!parsed.success) {
  return {
    ok: false,
    reason: `Invalid Project Id: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
  };
}
return { ok: true };
}

const imageIdSchema = z.uuid(
  "Invalid Image ID format.",
);


export function checkImageId_Schema(id:string): ValidationResult {
const parsed = imageIdSchema.safeParse(id);
if (!parsed.success) {
  return {
    ok: false,
    reason: `Invalid Image Id: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
  };
}
return { ok: true };
}



  const projectSearchSchema = z.object({
    query: z.string().trim().max(200).optional(),
    supervisorName: z.string().trim().max(160).optional(),
    projectType: z.enum(['PRE_GRADUATION',"GRADUATION"]).optional(),
  });
  

  export type ProjectSearchPayload = z.infer< typeof projectSearchSchema>;

  export function checkProject_QuerySearch_Schema(payload:ProjectSearchPayload): ValidationResult {
    const parsed = projectSearchSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        ok: false,
        reason: `Invalid Project Search Payload Id: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
      };
    }
    return { ok: true };
}
    
    


// ==========================================
// Project Data
// ==========================================
const projectTextSchema = z.string().trim();

const projectFeatureListSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Feature entries cannot be empty.")
      .max(1000, "Each feature must not exceed 1000 characters."),
  )
  .max(50, "Provide no more than 50 entries.");

export const projectDataSchema = z.object({
  title: projectTextSchema
    .min(2, "Project title must contain at least 2 characters.")
    .max(200, "Project title must not exceed 200 characters."),

  yearPresentation:z.string().max(6).optional(),

  summary: projectTextSchema.max(
    5000,
    "Project summary must not exceed 5000 characters.",
  ),

  description: projectTextSchema.max(
    12000,
    "Project description must not exceed 12000 characters.",
  ),

  problemStatement: projectTextSchema.max(
    12000,
    "Problem statement must not exceed 12000 characters.",
  ),

  proposedSolution: projectTextSchema.max(
    12000,
    "Proposed solution must not exceed 12000 characters.",
  ),

  objectives: projectTextSchema.max(
    12000,
    "Project objectives must not exceed 12000 characters.",
  ),


  targetUsers: projectTextSchema.max(
    12000,
    "Project target Users must not exceed 12000 characters.",
  ).optional(),


  availableResources: projectTextSchema.max(
    12000,
    "Project Available Resources must not exceed 12000 characters.",
  ).optional(),


  constraints: projectTextSchema.max(
    12000,
    "Project Constraints must not exceed 12000 characters.",
  ).optional(),

  projectSupervisorName: projectTextSchema.max(
    160,
    "Supervisor name must not exceed 160 characters.",
  ).optional(),
  projectType: z.enum(['PRE_GRADUATION',"GRADUATION"]).optional().default("PRE_GRADUATION"),

  inScopeFeatures: projectFeatureListSchema,
  outOfScopeFeatures: projectFeatureListSchema,

  technologies: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Technology entries cannot be empty.")
        .max(120, "Each technology must not exceed 120 characters."),
    )
    .max(50, "Provide no more than 50 technologies."),
});

// ==========================================
// Create Project
// ==========================================
export const createProjectSchema = projectDataSchema;

export type CreateProjectPayload = z.infer<
  typeof createProjectSchema
>;

export function checkProject_Create_Schema(
  payload: CreateProjectPayload,
): ValidationResult {
  const parsed = createProjectSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid project creation payload: ${parsed.error.issues
        .map((issue) => issue.message)
        .join(", ")}`,
    };
  }

  return { ok: true };
}

// ==========================================
// Update Project
// ==========================================
export const updateProjectSchema = z.object({
  projectId: z.uuid("Invalid project ID format."),
  data: projectDataSchema,
});

export type UpdateProjectPayload = z.infer<
  typeof updateProjectSchema
>;

export type UpdateProjectData = UpdateProjectPayload["data"];

export function checkProject_Update_Schema(
  payload: UpdateProjectPayload,
): ValidationResult {
  const parsed = updateProjectSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid project update payload: ${parsed.error.issues
        .map((issue) => issue.message)
        .join(", ")}`,
    };
  }

  return { ok: true };
}

// ==========================================
// Set Project Visibility
// ==========================================
export const setProjectVisibilitySchema = z.object({
  projectId: z.uuid("Invalid project ID format."),
  visibility: z.enum(["VISIBLE", "HIDDEN"]),
});

export type SetProjectVisibilityPayload = z.infer<
  typeof setProjectVisibilitySchema
>;

export function checkProject_Visibility_Set_Schema(
  payload: SetProjectVisibilityPayload,
): ValidationResult {
  const parsed = setProjectVisibilitySchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid project visibility payload: ${parsed.error.issues
        .map((issue) => issue.message)
        .join(", ")}`,
    };
  }

  return { ok: true };
}

// ==========================================
// Delete Project
// ==========================================
export const deleteProjectSchema = z.object({
  projectId: z.uuid("Invalid project ID format."),
});

export type DeleteProjectPayload = z.infer<
  typeof deleteProjectSchema
>;

export function checkProject_Delete_Schema(
  payload: DeleteProjectPayload,
): ValidationResult {
  const parsed = deleteProjectSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid project deletion payload: ${parsed.error.issues
        .map((issue) => issue.message)
        .join(", ")}`,
    };
  }

  return { ok: true };
}

// ==========================================
// Delete Project Image
// ==========================================
export const deleteProjectImageSchema = z.object({
  projectId: z.uuid("Invalid project ID format."),
  imageId: z.uuid("Invalid project image ID format."),
});

export type DeleteProjectImagePayload = z.infer<
  typeof deleteProjectImageSchema
>;

export function checkProjectImage_Delete_Schema(
  payload: DeleteProjectImagePayload,
): ValidationResult {
  const parsed = deleteProjectImageSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid project image deletion payload: ${parsed.error.issues
        .map((issue) => issue.message)
        .join(", ")}`,
    };
  }

  return { ok: true };
}
