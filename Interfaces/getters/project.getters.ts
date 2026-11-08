
// Interfaces/getters/project.getters.ts
"use server";

import { redirect } from "next/navigation";
import { requireUserForService } from "@/core/auth/session";
import { projectService } from "@/modules/project/services/project-service";
import type { ProjectSearchPayload } from "@/shared/validation/project";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";
import { aiService } from "@/modules/ai/services/ai-service";

// ==========================================
// List Projects
// ==========================================

export async function listProjectAction(
  search: ProjectSearchPayload = {},
  page?: number,
  pageSize?: number,
) {
  const actor = await requireUserForService();

  if ("redirect" in actor) {
    redirect(actor.redirect);
  }

  if ("error" in actor) {
    return { error: actor.error };
  }

  const { user } = actor;
  const locale = await getCurrentApplicationLanguage();
  return await projectService.listProjects(
    user,
    search,
    page,
    pageSize,
    locale
  );
}

// ==========================================
// Get Project By ID
// ==========================================

export async function getProjectByIdAction(projectId: string) {
  const actor = await requireUserForService();

  if ("redirect" in actor) {
    redirect(actor.redirect);
  }

  if ("error" in actor) {
    return { error: actor.error };
  }

  const { user } = actor;
  const locale = await getCurrentApplicationLanguage();

  const response = await projectService.getProjectById(
    user,
    projectId,
    locale
  );

  if ("error" in response) {
    return response;
  }

  return {
    ...response,
    user,
  };
}



// ==========================================
// Get Project Suggestions By ID
// ==========================================
export async function getProjectSuggestionsAction(projectId: string) {
  const actor = await requireUserForService();

  if ("redirect" in actor) {
    redirect(actor.redirect);
  }

  if ("error" in actor) {
    return { error: actor.error };
  }

  const { user } = actor;
  const locale = await getCurrentApplicationLanguage();

  const response = await aiService.listSuggestions(user, projectId, locale)
  return response
}
