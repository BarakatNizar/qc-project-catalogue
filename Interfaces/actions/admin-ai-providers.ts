"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserForService } from "@/core/auth/session";
import { toSafeMessage } from "@/core/errors/app-error";
import { aiProviderConfigService } from "@/modules/ai/services/ai-provider-config-service";
import { aiService } from "@/modules/ai/services/ai-service";
import {
  aiProviderConfigSaveSchema,
  aiProviderEnabledSchema,
  aiProviderIdSchema,
  aiServiceEnabledSchema,
  type AiProviderConfigSaveInput,
} from "@/shared/validation/ai-provider-config";

export type AdminAiProviderActionResult<T> = { data: T } | { error: string };

async function requireAdminActor() {
  const result = await requireUserForService();
  if ("redirect" in result) redirect(result.redirect);
  if ("error" in result) return { error: result.error } as const;
  if (result.user.role !== "ADMIN") {
    return { error: "Only administrators can manage AI configuration." } as const;
  }
  return { user: result.user } as const;
}

export async function saveAiProviderAction( payload: AiProviderConfigSaveInput, ): Promise<AdminAiProviderActionResult<Awaited<ReturnType<typeof aiProviderConfigService.getAdminConfiguration>>["providers"]>> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { error:actor.error! };

  const parsed = aiProviderConfigSaveSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid provider settings." };

  try {
    const providers = await aiProviderConfigService.saveProvider(actor.user, parsed.data);

    revalidatePath("/admin/ai/providers");
    revalidatePath("/admin/ai");
    return { data: providers };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function setAiProviderEnabledAction(
  payload: { id: string; enabled: boolean },
): Promise<AdminAiProviderActionResult<Awaited<ReturnType<typeof aiProviderConfigService.getAdminConfiguration>>["providers"]>> {
  const actor = await requireAdminActor();
  if ("error" in actor) return {error:actor.error!};

  const parsed = aiProviderEnabledSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid provider settings." };

  try {
    const providers = await aiProviderConfigService.setProviderEnabled(actor.user, parsed.data);
    revalidatePath("/admin/ai/providers");
    return { data: providers };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function deleteAiProviderAction(
  payload: { id: string },
): Promise<AdminAiProviderActionResult<Awaited<ReturnType<typeof aiProviderConfigService.getAdminConfiguration>>["providers"]>> {
  const actor = await requireAdminActor();
  if ("error" in actor) return {error:actor.error!};

  const parsed = aiProviderIdSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid provider identifier." };

  try {
    const providers = await aiProviderConfigService.deleteProvider(actor.user, parsed.data);
    revalidatePath("/admin/ai/providers");
    revalidatePath("/admin/ai/logs");
    return { data: providers };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}

export async function setAiServiceEnabledAction(
  payload: { enabled: boolean },
): Promise<AdminAiProviderActionResult<{ enabled: boolean }>> {
  const actor = await requireAdminActor();
  if ("error" in actor) return {error:actor.error!};

  const parsed = aiServiceEnabledSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid AI service setting." };

  try {
    await aiService.setEnabled(actor.user, parsed.data.enabled);
    revalidatePath("/admin/ai/providers");
    revalidatePath("/admin/ai");
    return { data: { enabled: parsed.data.enabled } };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}
