
// actions/project.ts
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
  ProjectImagesPayload,
} from "@/shared/validation/project";

// ==========================================
// Image Upload Configuration
// ==========================================

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_COUNT = 4;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// ==========================================
// Error Handling
// ==========================================

function getActionError(error: unknown): string {
  if (error instanceof AppError) {
    return toSafeMessage(error);
  }

  return toSafeMessage(new AppError("INTERNAL"));
}

// ==========================================
// Collect Project Images
// ==========================================


function matchesImageSignature(data: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mimeType === "image/png") return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP";
  if (mimeType === "image/avif") {
    if (data.length < 16 || data.toString("ascii", 4, 8) !== "ftyp") return false;
    const brandBytes = data.toString("ascii", 8, Math.min(data.length, 128));
    return brandBytes.includes("avif") || brandBytes.includes("avis");
  }
  return false;
}

function decodeImages(images: ProjectImagesPayload):Image[] {
  return images.map((image) => {
    const data = Buffer.from(image.dataBase64, "base64");
    if (data.toString("base64") !== image.dataBase64 || data.byteLength !== image.fileSizeBytes) {
      throw new AppError("VALIDATION", "An uploaded image could not be decoded correctly. Please select it again.");
    }
    if (!matchesImageSignature(data, image.mimeType)) {
      throw new AppError("VALIDATION", "The selected file content does not match its declared image type.");
    }
    return {
      dataBase64: new Uint8Array(data) as Uint8Array<ArrayBuffer>,
      mimeType: image.mimeType,
      fileName: image.fileName.slice(0, 255),
      fileSizeBytes: data.byteLength,
    };
  });
}

// ==========================================
// Create Project
// ==========================================
export  type Image= {
  dataBase64: Uint8Array;
  mimeType: string;
  fileName?: string;
  fileSizeBytes: number;
};

export async function createProjectAction(
  payload: CreateProjectPayload,
): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();

  if ("redirect" in actor) {
    redirect(actor.redirect);
  }

  if ("error" in actor) {
    return { error: actor.error };
  }

  const { user } = actor;

  try {
    const collectedImages = payload.images ? decodeImages(payload.images):[];

    const result = await projectService.create(
      user,
      payload,
      collectedImages,
    );

    if ("error" in result) {
      return result;
    }

    revalidatePath("/supervisor/projects");
    revalidatePath("/projects");

    return { ok: true };
  } catch (error) {
    return { error: getActionError(error) };
  }
}

// ==========================================
// Update Project
// ==========================================

export async function updateProjectAction(
  payload: UpdateProjectPayload,
): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();

  if ("redirect" in actor) {
    redirect(actor.redirect);
  }

  if ("error" in actor) {
    return { error: actor.error };
  }

  const { user } = actor;
  const { projectId, data } = payload;

  try {
    const collectedImages = payload.data.images ? decodeImages(payload.data.images):[];

    const result = await projectService.update(
      user,
      projectId,
      data,
      collectedImages,
    );

    if ("error" in result) {
      return result;
    }

    revalidatePath(`/supervisor/projects/${projectId}`);
    revalidatePath(`/supervisor/projects/${projectId}/edit`);
    revalidatePath("/projects");

    return { ok: true };
  } catch (error) {
    return { error: getActionError(error) };
  }
}

// ==========================================
// Set Project Visibility
// ==========================================

export async function setProjectVisibilityAction(
  payload: SetProjectVisibilityPayload,
): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();

  if ("redirect" in actor) {
    redirect(actor.redirect);
  }

  if ("error" in actor) {
    return { error: actor.error };
  }

  const { user } = actor;
  const { projectId, visibility } = payload;

  try {
    const result = await projectService.setVisibility(
      user,
      projectId,
      visibility,
    );

    if ("error" in result) {
      return result;
    }

    revalidatePath("/supervisor/projects");
    revalidatePath(`/supervisor/projects/${projectId}`);
    revalidatePath("/projects");

    return { ok: true };
  } catch (error) {
    return { error: getActionError(error) };
  }
}

// ==========================================
// Delete Project
// ==========================================

export async function deleteProjectAction(
  payload: DeleteProjectPayload,
): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();

  if ("redirect" in actor) {
    redirect(actor.redirect);
  }

  if ("error" in actor) {
    return { error: actor.error };
  }

  const { user } = actor;
  const { projectId } = payload;

  try {
    const result = await projectService.delete(
      user,
      projectId,
    );

    if ("error" in result) {
      return result;
    }

    revalidatePath("/supervisor/projects");
    revalidatePath("/projects");

    return { ok: true };
  } catch (error) {
    return { error: getActionError(error) };
  }
}

// ==========================================
// Delete Project Image
// ==========================================

export async function deleteProjectImageAction(
  payload: DeleteProjectImagePayload,
): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();

  if ("redirect" in actor) {
    redirect(actor.redirect);
  }

  if ("error" in actor) {
    return { error: actor.error };
  }

  const { user } = actor;
  const { projectId, imageId } = payload;

  try {
    const result = await projectService.deleteImage(
      user,
      projectId,
      imageId,
    );

    if ("error" in result) {
      return result;
    }

    revalidatePath(`/supervisor/projects/${projectId}/edit`);
    revalidatePath(`/supervisor/projects/${projectId}`);

    return { ok: true };
  } catch (error) {
    return { error: getActionError(error) };
  }
}
