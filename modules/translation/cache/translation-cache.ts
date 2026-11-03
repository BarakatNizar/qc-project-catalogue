import "server-only";

import { createHash } from "node:crypto";

import { redisGetManyJson, redisSetManyJson } from "@/infrastructure/redis/redis-operations";
import { parseRedisError } from "@/infrastructure/redis/redis-error-parser";
import type { RedisResult } from "@/infrastructure/redis/redis.types";

import type { CachedTranslation, TranslationField, TranslationLanguage, } from "../types/translation.types";
import type { TranslationCacheInput, TranslationCacheLookup, TranslationCacheWrite, } from "./translation-cache.types";

const TRANSLATION_CACHE_KEY_VERSION = process.env.TRANSLATION_CACHE_VERSION || "v1";
const TRANSLATION_PROVIDER_KEY = "database-configured";
const DEFAULT_TRANSLATION_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;

function getTranslationCacheTtlSeconds(): number {
  const configured = Number.parseInt(
    process.env.TRANSLATION_CACHE_TTL_SECONDS ?? "",
    10,
  );

  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_TRANSLATION_CACHE_TTL_SECONDS;
}

function createTranslationCacheKey( field: TranslationField, sourceText: string, targetLanguage: TranslationLanguage, ): string {
  const textHash = createHash("sha256").update(sourceText, "utf8").digest("hex");

  return [
    "translation",
    TRANSLATION_CACHE_KEY_VERSION,
    TRANSLATION_PROVIDER_KEY,
    targetLanguage,
    field,
    textHash,
  ].join(":");
}

function isCachedTranslation(value: unknown): value is CachedTranslation {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.translatedText === "string" &&
    (typeof record.detectedSourceLanguage === "string" ||
      record.detectedSourceLanguage === null)
  );
}

export async function getCachedTranslation( field: TranslationField, sourceText: string, targetLanguage: TranslationLanguage, ): Promise<RedisResult<CachedTranslation | null>> {
  try {
    const result = await redisGetManyJson<unknown>([
      createTranslationCacheKey(field, sourceText, targetLanguage),
    ]);

    if ("error" in result) return result;

    const value = result.data[0];
    if (value === null) return { data: null };
    if (!isCachedTranslation(value)) {
      return { error: "Cached translation data is invalid." };
    }

    return { data: value };
  } catch (error) {
    return { error: parseRedisError(error, "GET") };
  }
}

export async function setCachedTranslation( field: TranslationField, sourceText: string, targetLanguage: TranslationLanguage, value: CachedTranslation, ): Promise<RedisResult<null>> {
  try {
    return await redisSetManyJson(
      [
        {
          key: createTranslationCacheKey(field, sourceText, targetLanguage),
          value,
        },
      ],
      getTranslationCacheTtlSeconds(),
    );
  } catch (error) {
    return { error: parseRedisError(error, "SET") };
  }
}

export async function getCachedTranslations(
  inputs: TranslationCacheInput[],
  targetLanguage: TranslationLanguage,
): Promise<RedisResult<TranslationCacheLookup>> {
  if (inputs.length === 0) return { data: {} };

  try {
    const keys = inputs.map((input) =>
      createTranslationCacheKey(input.field, input.sourceText, targetLanguage),
    );

    const result = await redisGetManyJson<unknown>(keys);
    if ("error" in result) return result;

    const lookup: TranslationCacheLookup = {};

    for (let index = 0; index < inputs.length; index += 1) {
      const value = result.data[index];

      if (value === null) {
        lookup[inputs[index].id] = null;
      } else if (isCachedTranslation(value)) {
        lookup[inputs[index].id] = value;
      } else {
        return { error: "Cached translation data is invalid." };
      }
    }

    return { data: lookup };
  } catch (error) {
    return { error: parseRedisError(error, "MGET") };
  }
}

export async function setCachedTranslations(
  writes: TranslationCacheWrite[],
  targetLanguage: TranslationLanguage,
): Promise<RedisResult<null>> {
  if (writes.length === 0) return { data: null };

  try {
    const entries = new Map<string, CachedTranslation>();

    for (const write of writes) {
      entries.set(
        createTranslationCacheKey(
          write.field,
          write.sourceText,
          targetLanguage,
        ),
        write.value,
      );
    }

    return redisSetManyJson(
      [...entries].map(([key, value]) => ({ key, value })),
      getTranslationCacheTtlSeconds(),
    );
  } catch (error) {
    return { error: parseRedisError(error, "MSET") };
  }
}
