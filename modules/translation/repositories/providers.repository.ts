import "server-only";

import { prisma } from "@/infrastructure/database/prisma"; 
import { decryptProviderSecret, encryptProviderSecret } from "@/modules/translation/security/provider-secret-crypto";
import type {
  CreateTranslationProviderInput,
  RuntimeTranslationProviderConfig,
  TranslationProviderAdminDto,
  TranslationProviderOrderInput,
  UpdateTranslationProviderInput,
} from "@/modules/translation/types/provider-config.types";

export type ProviderRepositoryResult<T> = { data: T } | { error: string };

type ProviderRecord = {
  id: string;
  name: string;
  providerType: RuntimeTranslationProviderConfig["providerType"];
  baseUrl: string;
  encryptedApiKey: string | null;
  region: string | null;
  model: string | null;
  timeoutMs: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function prismaCode(error: unknown): string | null {
  if (!isRecord(error) || typeof error.code !== "string") return null;
  return error.code;
}

function parseRepositoryError(error: unknown, operation: string): string {
  const code = prismaCode(error);

  if (code === "P2002") {
    return "A translation provider of this type is already configured.";
  }
  if (code === "P2025") {
    return "The requested translation provider was not found.";
  }
  if (code === "P2003") {
    return "The translation provider operation violates a database relation constraint.";
  }
  console.error("ERROR:\n",error)
  console.error(`[Translation Providers] ${operation} failed`, {
    errorName: error instanceof Error ? error.name : "UnknownError",
    prismaCode: code,
  });

  return `Unable to ${operation.toLowerCase()} translation provider configuration.`;
}

function toAdminDto(record: ProviderRecord): TranslationProviderAdminDto {
  return {
    id: record.id,
    name: record.name,
    providerType: record.providerType,
    baseUrl: record.baseUrl,
    hasApiKey: Boolean(record.encryptedApiKey),
    region: record.region,
    model: record.model,
    timeoutMs: record.timeoutMs,
    enabled: record.enabled,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toRuntimeConfig(record: ProviderRecord): RuntimeTranslationProviderConfig {
  let apiKey: string | null = null;
  let configurationError: string | undefined;

  if (record.encryptedApiKey) {
    try {
      apiKey = decryptProviderSecret(record.encryptedApiKey);
    } catch (error) {
      configurationError = "Stored provider credentials could not be decrypted. Check the translation encryption key.";
      console.error("[Translation Providers] Credential decryption failed", {
        providerId: record.id,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  return {
    id: record.id,
    name: record.name,
    providerType: record.providerType,
    baseUrl: record.baseUrl,
    apiKey,
    region: record.region,
    model: record.model,
    timeoutMs: record.timeoutMs,
    enabled: record.enabled,
    sortOrder: record.sortOrder,
    ...(configurationError ? { configurationError } : {}),
  };
}

class ProvidersRepository {
  async getSettings() {
    const settings = await prisma.translationServiceSettings.findUnique({ where: { id: "global" } });
    return settings ?? { id: "global", enabled: true, updatedAt: new Date(0) };
  }

  async setServiceEnabled(enabled: boolean) {
    return prisma.translationServiceSettings.upsert({
      where: { id: "global" },
      update: { enabled },
      create: { id: "global", enabled },
    });
  }

  async listAll(): Promise<ProviderRepositoryResult<TranslationProviderAdminDto[]>> {
    try {
      const records = await prisma.translationProviderConfig.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      return { data: records.map((record) => toAdminDto(record as ProviderRecord)) };
    } catch (error) {
      return { error: parseRepositoryError(error, "List") };
    }
  }

  async getEnabledForRuntime(): Promise<ProviderRepositoryResult<RuntimeTranslationProviderConfig[]>> {
    try {
      const records = await prisma.translationProviderConfig.findMany({
        where: { enabled: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      return {
        data: records.map((record) => toRuntimeConfig(record as ProviderRecord)),
      };
    } catch (error) {
      return { error: parseRepositoryError(error, "Load enabled") };
    }
  }

  async create(
    input: CreateTranslationProviderInput,
  ): Promise<ProviderRepositoryResult<TranslationProviderAdminDto>> {
    try {
      const record = await prisma.translationProviderConfig.create({
        data: {
          name: input.name,
          providerType: input.providerType,
          baseUrl: input.baseUrl,
          encryptedApiKey: input.apiKey ? encryptProviderSecret(input.apiKey) : null,
          region: input.region ?? null,
          model: input.model ?? null,
          timeoutMs: input.timeoutMs ?? 45_000,
          enabled: input.enabled ?? true,
          sortOrder: input.sortOrder ?? 0,
        },
      });
      return { data: toAdminDto(record as ProviderRecord) };
    } catch (error) {
      return { error: parseRepositoryError(error, "Create") };
    }
  }

  async update(
    input: UpdateTranslationProviderInput,
  ): Promise<ProviderRepositoryResult<TranslationProviderAdminDto>> {
    try {
      const data: {
        name?: string;
        baseUrl?: string;
        encryptedApiKey?: string | null;
        region?: string | null;
        model?: string | null;
        timeoutMs?: number;
        enabled?: boolean;
        sortOrder?: number;
      } = {};

      if (input.name !== undefined) data.name = input.name;
      if (input.baseUrl !== undefined) data.baseUrl = input.baseUrl;
      if (input.region !== undefined) data.region = input.region;
      if (input.model !== undefined) data.model = input.model;
      if (input.timeoutMs !== undefined) data.timeoutMs = input.timeoutMs;
      if (input.enabled !== undefined) data.enabled = input.enabled;
      if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

      if (input.clearApiKey) {
        data.encryptedApiKey = null;
      } else if (input.apiKey !== undefined) {
        data.encryptedApiKey = encryptProviderSecret(input.apiKey);
      }

      const record = await prisma.translationProviderConfig.update({
        where: { id: input.id },
        data,
      });
      return { data: toAdminDto(record as ProviderRecord) };
    } catch (error) {
      return { error: parseRepositoryError(error, "Update") };
    }
  }

  async setEnabled(
    id: string,
    enabled: boolean,
  ): Promise<ProviderRepositoryResult<TranslationProviderAdminDto>> {
    try {
      const record = await prisma.translationProviderConfig.update({
        where: { id },
        data: { enabled },
      });
      return { data: toAdminDto(record as ProviderRecord) };
    } catch (error) {
      return { error: parseRepositoryError(error, "Update status for") };
    }
  }

  async reorder(
    items: TranslationProviderOrderInput[],
  ): Promise<ProviderRepositoryResult<null>> {
    try {
      await prisma.$transaction(
        items.map((item) =>
          prisma.translationProviderConfig.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          }),
        ),
      );
      return { data: null };
    } catch (error) {
      return { error: parseRepositoryError(error, "Reorder") };
    }
  }

  async remove(id: string): Promise<ProviderRepositoryResult<null>> {
    try {
      await prisma.translationProviderConfig.delete({ where: { id } });
      return { data: null };
    } catch (error) {
      return { error: parseRepositoryError(error, "Delete") };
    }
  }
}

export const providersRepository = new ProvidersRepository();
