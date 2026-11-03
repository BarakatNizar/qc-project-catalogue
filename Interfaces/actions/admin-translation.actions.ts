"use server";

import { z } from "zod";

import { getServerUserFromAccess, requireUserForService } from "@/core/auth/session";
import { providersRepository } from "@/modules/translation/repositories/providers.repository";
import type { TranslationProviderType } from "@/modules/translation/types/provider-config.types"; 
import { translationService } from "@/modules/translation/services/translation.service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toSafeMessage } from "@/core/errors/app-error";

const providerTypes = [
  "google",
  "microsoft",
  "deepl",
  "libretranslate",
  "lingva",
  "ai_openrouter",
  "ai_local",
] as const satisfies readonly TranslationProviderType[];

const providerTypeSchema = z.enum(providerTypes);

const createProviderSchema = z.object({
  name: z.string().trim().min(1).max(80),
  providerType: providerTypeSchema,
  // Google uses this field for its Cloud project ID/resource parent. Other
  // providers use an HTTP(S) base URL. Provider-specific validation is in the guide.
  baseUrl: z.url("Invalid Base Url !").trim().min(1).max(500),
  apiKey: z.string().trim().min(1).max(20_000).optional().nullable(),
  region: z.string().trim().max(200).optional().nullable(),
  model: z.string().trim().max(180).optional().nullable(),
  timeoutMs: z.number().int().min(1_000).max(1_800_000).optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
}).refine(
  (value) =>
    !["microsoft", "deepl", "ai_openrouter"].includes(value.providerType) ||
    Boolean(value.apiKey),
  { message: "This provider type requires an API key or credential." },
).refine(
  (value) =>
    !["ai_openrouter", "ai_local"].includes(value.providerType) ||
    Boolean(value.model),
  { message: "AI providers require a model identifier." },
);

const updateProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  baseUrl: z.string().trim().min(1).max(500).optional(),
  apiKey: z.string().trim().min(1).max(20_000).optional(),
  clearApiKey: z.boolean().optional(),
  region: z.string().trim().max(200).nullable().optional(),
  model: z.string().trim().max(180).nullable().optional(),
  timeoutMs: z.number().int().min(1_000).max(1_800_000).optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
}).refine(
  (value) => !(value.clearApiKey && value.apiKey !== undefined),
  { message: "Choose either a new API key or clearApiKey, not both." },
).refine(
  (value) => Object.entries(value).some(([key, entry]) => key !== "id" && entry !== undefined),
  { message: "Provide at least one provider field to update." },
);

const setEnabledSchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0).max(100_000),
    }),
  ).min(1).max(7),
}).refine(
  ({ items }) => new Set(items.map((item) => item.id)).size === items.length,
  { message: "Provider IDs must be unique." },
).refine(
  ({ items }) => new Set(items.map((item) => item.sortOrder)).size === items.length,
  { message: "Provider sort orders must be unique." },
);

const idSchema = z.string().uuid();

async function requireAdmin(): Promise<{ data: true } | { error: string }> {
  try {
    const result = await getServerUserFromAccess();

    if ("error" in result) {
      return { error: result.error || "Not authenticated." };
    }

    if (result.role !== "ADMIN") {
      return { error: "You are not authorized to manage translation providers." };
    }

    return { data: true };
  } catch {
    return { error: "Unable to verify administrator access." };
  }
}

function getValidationError(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message || "Invalid translation provider input.";
}


async function requireAdminActor() {
  const result = await requireUserForService();
  if ("redirect" in result) redirect(result.redirect);
  if ("error" in result) return { error: result.error } as const;
  if (result.user.role !== "ADMIN") {
    return { error: "Only administrators can manage AI configuration." } as const;
  }
  return { user: result.user } as const;
}

export async function setTranslationServiceEnabledAction( payload: { enabled: boolean },): Promise<{ enabled: boolean }|{error:string}> {
  const actor = await requireAdminActor();
  if ("error" in actor) return {error:actor.error!};

  try {
    await translationService.setServiceEnabled(actor.user, payload.enabled);
    revalidatePath("/admin/ai/providers");
    revalidatePath("/admin/ai");
    return { enabled:payload.enabled };
  } catch (error) {
    return { error: toSafeMessage(error) };
  }
}


export async function getTranslationConfigurationAction() {
  const access = await requireAdmin();
  if ("error" in access) return access;
  const providers= await providersRepository.listAll()
  if("error" in providers)
    return {error:providers.error};
  const enabled = await translationService.getServiceSettings()
  if("error" in enabled)
    return {error:enabled.error};
  
  return {enabled:enabled.enabled, providers};
}

export async function getTranslationState() {
  
  const enabled = await translationService.getServiceSettings()
  if("error" in enabled)
    return {error:enabled.error};
  
  return {enabled:enabled.enabled}
}

export async function listTranslationProvidersAction() {
  const access = await requireAdmin();
  if ("error" in access) return access;
  return await providersRepository.listAll();
}




export async function createTranslationProviderAction(input: unknown) {
  const access = await requireAdmin();
  if ("error" in access) return access;

  const parsed = createProviderSchema.safeParse(input);
  if (!parsed.success) return { error: getValidationError(parsed.error) };

  return await providersRepository.create(parsed.data);
}

export async function updateTranslationProviderAction(input: unknown) {
  const access = await requireAdmin();
  if ("error" in access) return access;

  const parsed = updateProviderSchema.safeParse(input);
  if (!parsed.success) return { error: getValidationError(parsed.error) };

  return await providersRepository.update(parsed.data);
}

export async function setTranslationProviderEnabledAction(input: unknown) {
  const access = await requireAdmin();
  if ("error" in access) return access;

  const parsed = setEnabledSchema.safeParse(input);
  if (!parsed.success) return { error: getValidationError(parsed.error) };

  return await providersRepository.setEnabled(parsed.data.id, parsed.data.enabled);
}

export async function reorderTranslationProvidersAction(input: unknown) {
  const access = await requireAdmin();
  if ("error" in access) return access;

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return { error: getValidationError(parsed.error) };

  return await providersRepository.reorder(parsed.data.items);
}

export async function deleteTranslationProviderAction(id: string) {
  const access = await requireAdmin();
  if ("error" in access) return access;

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: getValidationError(parsed.error) };

  return await providersRepository.remove(parsed.data);
}
