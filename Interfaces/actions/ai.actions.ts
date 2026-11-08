"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireUserForService } from "@/core/auth/session";
import { toSafeMessage } from "@/core/errors/app-error";
import { aiService } from "@/modules/ai/services/ai-service";
import {
  deleteAiSuggestionActionSchema,
  extractProjectFromFileActionSchema,
  requestAiSuggestionsActionSchema,
  setAiEnabledActionSchema,
  type DeleteAiSuggestionActionPayload,
  type ExtractProjectFromFileActionPayload,
  type RequestAiSuggestionsActionPayload,
  type SetAiEnabledActionPayload,
} from "@/shared/validation/ai-action";
import type { ExtractedProject } from "@/modules/project/types";

export async function requestAiSuggestionsAction( payload: RequestAiSuggestionsActionPayload, ) {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) return { error: actor.error };

  const input = requestAiSuggestionsActionSchema.safeParse(payload);
  if (!input.success) return { error: "Invalid project identifier." };

  try {
    return await aiService.requestSuggestions(actor.user, input.data, randomUUID());
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function deleteAiSuggestionAction( payload: DeleteAiSuggestionActionPayload, ): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) return { error: actor.error };

  const input = deleteAiSuggestionActionSchema.safeParse(payload);
  if (!input.success) return { error: "Invalid suggestion or project identifier." };

  try {
    const result= await aiService.deleteSuggestion(actor.user, input.data.suggestionId);
    revalidatePath(`/supervisor/projects/${input.data.projectId}`);
    revalidatePath(`/projects/${input.data.projectId}`);
    return result;
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function setAiEnabledAction( payload: SetAiEnabledActionPayload, ): Promise<{ ok: true } | { error: string }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) return { error: actor.error };

  const input = setAiEnabledActionSchema.safeParse(payload);
  if (!input.success) return { error: "Invalid AI service setting." };

  try {
    const result= await aiService.setEnabled(actor.user, input.data.enabled);
    revalidatePath("/admin/ai");
    revalidatePath("/admin/ai/providers");
    return result;
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function extractProjectFromFileAction( payload: ExtractProjectFromFileActionPayload, ): Promise<{ error: string } | { data: ExtractedProject }> {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) return { error: actor.error };

  const input = extractProjectFromFileActionSchema.safeParse(payload);
  if (!input.success) return { error: input.error.issues[0]?.message ?? "Invalid document upload." };

  try {
    const file = new File([input.data.data], input.data.fileName, { type: input.data.mimeType });
    const result = await aiService.extractProjectFromFile(actor.user, file, randomUUID());
    return result;
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}
