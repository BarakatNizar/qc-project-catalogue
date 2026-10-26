"use server";

import { redirect } from "next/navigation";
import { requireUserForService } from "@/core/auth/session";
import { toSafeMessage } from "@/core/errors/app-error";
import { aiLogsService } from "@/modules/ai/services/ai-logs-service";
import { aiLogsFilterSchema, type AiLogsFilterInput } from "@/shared/validation/ai-logs";

/** Server Component read boundary. It is intentionally not a client-invoked Server Action. */
export async function getAiLogsAction(rawFilters: AiLogsFilterInput) {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) return { error: actor.error } as const;
  if (actor.user.role === "STUDENT") return { error: "Only administrators can view AI logs." } as const;

  const parsed = aiLogsFilterSchema.safeParse(rawFilters);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid log filters." } as const;
  try {
    return { data: await aiLogsService.getLogs(actor.user, parsed.data) } as const;
  } catch (error) {
    return { error: toSafeMessage(error) } as const;
  }
}
