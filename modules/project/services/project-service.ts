
import "server-only";

import { Prisma } from "@prisma/client";
import type { ServerUser } from "@/core/auth/session";
import { authorize } from "@/core/authorization/authorization-layer";
import { AppError } from "@/core/errors/app-error";

import {
  checkProject_Create_Schema,
  checkProject_Update_Schema,
  checkProject_Visibility_Set_Schema,
  checkProject_Delete_Schema,
  checkProjectImage_Delete_Schema,
  checkProjectId_Schema,
  checkProject_QuerySearch_Schema,
  type CreateProjectPayload,
  type UpdateProjectData,
  type SetProjectVisibilityPayload,
  type DeleteProjectPayload,
  type DeleteProjectImagePayload,
  type ProjectSearchPayload,
} from "@/shared/validation/project";

import {
  projectRepository,
  type ProjectWriteData,
} from "@/modules/project/repositories/project-repository";

import { toProjectDto } from "@/modules/project/mappers/project-mapper";
import { getPaginationMeta } from "@/shared/utils/pagincation-utils";

// ==========================================
// Map Known Database Errors
// ==========================================
function mapKnownError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError("CONFLICT");
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new AppError("NOT_FOUND");
  throw error;
}

// ==========================================
// Throw Validation Errors
// ==========================================
function assertValid(
  validation: { ok: true } | { ok: false; reason: string },
): void {
  if (!validation.ok) {
    throw new AppError("VALIDATION", validation.reason);
  }
}

// ==========================================
// Prepare Repository Write Data
// Call only after successful validation.
// ==========================================
function parseWriteData(
  input: CreateProjectPayload | UpdateProjectData,
  images?: ProjectWriteData["images"],
): ProjectWriteData {
  return {
    ...input,
    images,    
  };
}

// ==========================================
// Project Service
// ==========================================

export const projectService = {
  // ==========================================
  // List Projects
  // ==========================================
  // async listProject(actor: ServerUser, search: ProjectSearchPayload = {}) {
  //   /*
  //   (alias) type ProjectSearchPayload = {
  //     query?: string | undefined;
  //     supervisorName?: string | undefined;
  //     projectType?: "PRE_GRADUATION" | "GRADUATION" | undefined;
  //   }
  //    */
  //  assertValid(checkProject_QuerySearch_Schema(search));

  //   const supervisor = actor.role === "SUPERVISOR";

  //   if ( actor.role !== "SUPERVISOR" && actor.role !== "STUDENT" ) {
  //     throw new AppError("FORBIDDEN");
  //   }

  //   const projects = await projectRepository.list({ query: search.query, supervisorName: search.supervisorName, projectType: search.projectType , includeHidden: supervisor, });

  //   return projects.map(toProjectDto);
  // },
  async listProject(actor: ServerUser, search: ProjectSearchPayload = {}, page = 1, pageSize = 10) {
    assertValid(checkProject_QuerySearch_Schema(search));

    const supervisor = actor.role === "SUPERVISOR";

    if (actor.role !== "SUPERVISOR" && actor.role !== "STUDENT" && actor.role !== "ADMIN") {
      throw new AppError("FORBIDDEN");
    }

    const { data, totalCount } = await projectRepository.list({ 
      query: search.query, 
      supervisorName: search.supervisorName, 
      projectType: search.projectType, 
      includeHidden: supervisor,
      page,
      pageSize,
    });

    return {
      data: data.map(toProjectDto),
      pagination: getPaginationMeta(totalCount, page, pageSize),
    };
  },
  // ==========================================
  // Get Project
  // ==========================================
  async getProjectById(actor: ServerUser, projectId: string) {
    if ( actor.role !== "STUDENT" && actor.role !== "SUPERVISOR" ) {
      throw new AppError("FORBIDDEN");
    }
    
    assertValid(checkProjectId_Schema(projectId))
    
    const project = await projectRepository.findById(projectId);

    if (
      !project ||
      (actor.role === "STUDENT" &&
        project.visibility !== "VISIBLE")
    ) {
      throw new AppError("NOT_FOUND");
    }

    return {data:toProjectDto(project)};
  },

  // ==========================================
  // Get Project Image
  // ==========================================
  async getImage( actor: ServerUser, projectId: string, imageId: string, ) {
    assertValid(checkProjectId_Schema(projectId));
    assertValid(checkProjectId_Schema(imageId));

    if (
      actor.role !== "SUPERVISOR" &&
      actor.role !== "STUDENT"
    ) {
      throw new AppError("FORBIDDEN");
    }

    const project = await projectRepository.findById(projectId);

    if (!project ) {
      throw new AppError("NOT_FOUND");
    }else if ((actor.role === "STUDENT" && project.visibility !== "VISIBLE")){
      throw new AppError("UNAUTHENTICATED");
    }

    const image = await projectRepository.getImage( projectId, imageId );

    if (!image) {
      throw new AppError("NOT_FOUND");
    }

    return image;
  },


  // ==========================================
  // Create Project
  // ==========================================
  async create( actor: ServerUser, payload: CreateProjectPayload, images?: ProjectWriteData["images"], ) {
    authorize(actor, "PROJECT_MANAGE");

    const validation = checkProject_Create_Schema(payload);
    assertValid(validation);

    const input = parseWriteData(payload, images);

    try {
      const created = await projectRepository.create(input);
      return toProjectDto(created);
    } catch (error) {
      return mapKnownError(error);
    }
  },

  // ==========================================
  // Update Project
  // ==========================================
  async update( actor: ServerUser, projectId: string, data: UpdateProjectData, images?: ProjectWriteData["images"], ) {
    authorize(actor, "PROJECT_MANAGE");

    const validation = checkProject_Update_Schema({ projectId: projectId, data, });

    assertValid(validation);

    const id = projectId;
    const input = parseWriteData(data, images);

    try {
      const updated = await projectRepository.update(id, input);
      return toProjectDto(updated);
    } catch (error) {
      return mapKnownError(error);
    }
  },

  // ==========================================
  // Set Project Visibility
  // ==========================================
  async setVisibility( actor: ServerUser, projectId: string, visibility: SetProjectVisibilityPayload["visibility"], ) {
    authorize(actor, "PROJECT_MANAGE");

    const payload: SetProjectVisibilityPayload = {
      projectId: projectId,
      visibility,
    };

    const validation =
      checkProject_Visibility_Set_Schema(payload);

    assertValid(validation);

    try {
      const updated = await projectRepository.setVisibility(
        payload.projectId,
        payload.visibility,
      );

      return toProjectDto(updated);
    } catch (error) {
      return mapKnownError(error);
    }
  },

  // ==========================================
  // Delete Project
  // ==========================================
  async delete(actor: ServerUser, projectId: string) {
    authorize(actor, "PROJECT_MANAGE");

    const payload: DeleteProjectPayload = {
      projectId: projectId,
    };

    const validation = checkProject_Delete_Schema(payload);
    assertValid(validation);

    try {
      return await projectRepository.delete(payload.projectId);
    } catch (error) {
      return mapKnownError(error);
    }
  },

  
  // ==========================================
  // Delete Project Image
  // ==========================================
  async deleteImage( actor: ServerUser, projectId: string, imageId: string ) {
    authorize(actor, "PROJECT_MANAGE");
    assertValid(checkProjectId_Schema(projectId));
    assertValid(checkProjectId_Schema(imageId));

    const payload: DeleteProjectImagePayload = {
      projectId: projectId,
      imageId: imageId,
    };

    const validation = checkProjectImage_Delete_Schema(payload);

    assertValid(validation);

    const result = await projectRepository.deleteImage(
      payload.projectId,
      payload.imageId,
    );

  },
};
