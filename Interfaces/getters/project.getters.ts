//Interfaces/getters/project.getters.ts
"use server";

import { redirect } from "next/navigation";
import { requireUserForService } from "@/core/auth/session";
import { toSafeMessage } from "@/core/errors/app-error";
import { projectService } from "@/modules/project/services/project-service";
import type { ProjectSearchPayload } from "@/shared/validation/project";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";

export async function listProjectAction( search: ProjectSearchPayload = {}, page?: number, pageSize?: number ) {
  const actor = await requireUserForService();
  if ("redirect" in actor) {
    redirect(actor.redirect);
  } else if ("error" in actor) {
    return { error: actor.error };
  }
  const { user } = actor;
  const targetLanguage = await getCurrentApplicationLanguage();

  try {
    return await projectService.listProjects(user, search, page, pageSize, targetLanguage);
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
  const targetLanguage = await getCurrentApplicationLanguage();
  try {
    const response =  await projectService.getProjectById(user, projectId, targetLanguage );
    return {...response, user}
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}