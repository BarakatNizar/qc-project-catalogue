//Interfaces/getters/project.getters.ts
"use server";

import { redirect } from "next/navigation";
import { requireUserForService } from "@/core/auth/session";
import { toSafeMessage } from "@/core/errors/app-error";
import { projectService } from "@/modules/project/services/project-service";
import type { ProjectSearchPayload } from "@/shared/validation/project";

export async function listProjectAction( search: ProjectSearchPayload = {}, page?: number, pageSize?: number ) {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    return await projectService.listProject(user, search, page, pageSize);
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function getProjectByIdAction(projectId: string) {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;

  try {
    const {data} =  await projectService.getProjectById(user, projectId);
    return {data, user}
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}