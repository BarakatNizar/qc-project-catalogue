
// @/infrastructure/redis/redis-operations.ts
import "server-only";

import { getRedisClient } from "./redis-client";
import { logRedisError, parseRedisError } from "./redis-error-parser";
import type { RedisJsonEntry, RedisResult } from "./redis.types";

function serializeJson(value: unknown): RedisResult<unknown> {
  try {
    if (value === undefined) {
      return { error: parseRedisError(new Error("Undefined JSON value"), "SERIALIZE") };
    }
    return { data: value };
  } catch (error) {
    logRedisError("SERIALIZE", error);
    return { error: parseRedisError(error, "SERIALIZE") };
  }
}

function deserializeJson<T>(value: unknown): RedisResult<T> {
  try {
    if (value === null || value === undefined) {
      return { data: null as unknown as T };
    }
    if (typeof value === "string") {
      try {
        return { data: JSON.parse(value) as T };
      } catch {
        return { data: value as unknown as T };
      }
    }
    return { data: value as T };
  } catch (error) {
    logRedisError("DESERIALIZE", error);
    return { error: parseRedisError(error, "DESERIALIZE") };
  }
}

/** Internal generic operation. Domain code should use domain cache functions. */
export async function redisGetJson<T>(
  key: string,
): Promise<RedisResult<T | null>> {
  const clientResult = await getRedisClient();
  if ("error" in clientResult) return clientResult;

  try {
    const value = await clientResult.data.get<unknown>(key);
    if (value === null || value === undefined) return { data: null };

    return deserializeJson<T>(value);
  } catch (error) {
    logRedisError("GET", error);
    return { error: parseRedisError(error, "GET") };
  }
}

/** Internal generic operation. Domain code should use domain cache functions. */
export async function redisGetManyJson<T>(
  keys: string[],
): Promise<RedisResult<Array<T | null>>> {
  if (keys.length === 0) return { data: [] };

  const clientResult = await getRedisClient();
  if ("error" in clientResult) return clientResult;

  try {
    const values = await clientResult.data.mget<unknown[]>(keys);
    const parsed: Array<T | null> = [];

    for (const value of values) {
      if (value === null || value === undefined) {
        parsed.push(null);
        continue;
      }

      const result = deserializeJson<T>(value);
      if ("error" in result) return result;
      parsed.push(result.data);
    }

    return { data: parsed };
  } catch (error) {
    logRedisError("MGET", error);
    return { error: parseRedisError(error, "MGET") };
  }
}

/** Internal generic operation. Domain code should use domain cache functions. */
export async function redisSetJson<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<RedisResult<null>> {
  const serialized = serializeJson(value);
  if ("error" in serialized) return serialized;

  const clientResult = await getRedisClient();
  if ("error" in clientResult) return clientResult;

  try {
    // Upstash uses lowercase 'ex' for TTL
    await clientResult.data.set(key, serialized.data, {
      ex: Math.max(1, Math.floor(ttlSeconds)),
    });

    return { data: null };
  } catch (error) {
    logRedisError("SET", error);
    return { error: parseRedisError(error, "SET") };
  }
}

/** Internal generic operation. Domain code should use domain cache functions. */
export async function redisSetManyJson<T>(
  entries: RedisJsonEntry<T>[],
  ttlSeconds: number,
): Promise<RedisResult<null>> {
  if (entries.length === 0) return { data: null };

  const clientResult = await getRedisClient();
  if ("error" in clientResult) return clientResult;

  try {
    const ttl = Math.max(1, Math.floor(ttlSeconds));
    const pipeline = clientResult.data.pipeline();

    for (const entry of entries) {
      const serialized = serializeJson(entry.value);
      if ("error" in serialized) return serialized;
      pipeline.set(entry.key, serialized.data, { ex: ttl });
    }

    await pipeline.exec();
    return { data: null };
  } catch (error) {
    logRedisError("MSET", error);
    return { error: parseRedisError(error, "MSET") };
  }
}

/** Internal generic operation. Domain code should use domain cache functions. */
export async function redisDeleteMany(
  keys: string[],
): Promise<RedisResult<null>> {
  if (keys.length === 0) return { data: null };

  const clientResult = await getRedisClient();
  if ("error" in clientResult) return clientResult;

  try {
    await clientResult.data.del(...keys);
    return { data: null };
  } catch (error) {
    logRedisError("DELETE", error);
    return { error: parseRedisError(error, "DELETE") };
  }
}