//actions/project.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserForService } from "@/core/auth/session";
import { AppError, toSafeMessage } from "@/core/errors/app-error";
import { projectService } from "@/modules/project/services/project-service";

import type {
  CreateProjectPayload,
  UpdateProjectPayload,
  SetProjectVisibilityPayload,
  DeleteProjectPayload,
  DeleteProjectImagePayload,
} from "@/shared/validation/project";

// ==========================================
// Image Upload Configuration
// ==========================================
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_COUNT = 4;

const ALLOWED_IMAGE_TYPES = new Set([ "image/jpeg", "image/png", "image/webp", "image/avif", ]);

// ==========================================
// Collect Project Images
// ==========================================
async function collectImages(formData: FormData) {
  const files = formData.getAll("images").filter( (value): value is File => value instanceof File && value.size > 0, );

  if (files.length > MAX_IMAGE_COUNT) {
    throw new AppError( "VALIDATION",`Upload no more than ${MAX_IMAGE_COUNT} images at a time.`, );
  }

  let total = 0;

  const images: {
    data: Uint8Array;
    mimeType: string;
    fileName: string;
    fileSizeBytes: number;
  }[] = [];

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new AppError( "VALIDATION", "Only JPEG, PNG, WebP, and AVIF images are supported.", );
    }

    if (file.size > MAX_IMAGE_BYTES) {
      throw new AppError( "VALIDATION", "Each image must be 4 MB or smaller.", );
    }

    total += file.size;

    if (total > 12 * 1024 * 1024) {
      throw new AppError( "VALIDATION", "The combined image upload must not exceed 12 MB.", );
    }

    images.push({
      data: new Uint8Array(await file.arrayBuffer()),
      mimeType: file.type,
      fileName: file.name.slice(0, 255),
      fileSizeBytes: file.size,
    });
  }

  return images;
}

// ==========================================
// Create Project
// ==========================================
export async function createProjectAction( payload: CreateProjectPayload, formDataImages?: FormData ): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    const collectedImages = formDataImages ? await collectImages(formDataImages) : [];

    await projectService.create(user, payload, collectedImages);
    
    revalidatePath("/supervisor/projects");
    revalidatePath("/projects");
    return { ok: true };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

// ==========================================
// Update Project
// ==========================================
export async function updateProjectAction( payload: UpdateProjectPayload, formDataImages?: FormData, ): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  const { projectId, data } = payload;

  try {
    const collectedImages = formDataImages ? await collectImages(formDataImages) : [];
    
    await projectService.update(user, projectId, data, collectedImages);
    
    revalidatePath(`/supervisor/projects/${projectId}`);
    revalidatePath(`/supervisor/projects/${projectId}/edit`);
    revalidatePath("/projects");
    return { ok: true };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

// ==========================================
// Set Project Visibility
// ==========================================
export async function setProjectVisibilityAction( payload: SetProjectVisibilityPayload, ): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  const { projectId, visibility } = payload;

  if (visibility !== "VISIBLE" && visibility !== "HIDDEN") {
    return { error: "Invalid visibility" };
  }

  try {
    await projectService.setVisibility(user, projectId, visibility);
    revalidatePath("/supervisor/projects");
    revalidatePath(`/supervisor/projects/${projectId}`);
    revalidatePath("/projects");
    return { ok: true };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

// ==========================================
// Delete Project
// ==========================================
export async function deleteProjectAction( payload: DeleteProjectPayload, ): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  const { projectId } = payload;

  try {
    await projectService.delete(user, projectId);
    revalidatePath("/supervisor/projects");
    revalidatePath("/projects");
    return { ok: true };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

// ==========================================
// Delete Project Image
// ==========================================
export async function deleteProjectImageAction( payload: DeleteProjectImagePayload ): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  const { projectId, imageId } = payload;

  try {
    await projectService.deleteImage(user, projectId, imageId);
    revalidatePath(`/supervisor/projects/${projectId}/edit`);
    revalidatePath(`/supervisor/projects/${projectId}`);
    return { ok: true };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}