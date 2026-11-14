// @/infrastructure/redis/redis-client.ts
import "server-only";

import { Redis } from "@upstash/redis";

import { logRedisError, parseRedisError } from "./redis-error-parser";
import type { AppRedisClient, RedisResult } from "./redis.types";

let cachedRedisClient: AppRedisClient | null = null;
let errorCoolDownUntil = 0; // Timestamp (in ms) until which the client remains idle

const COOL_DOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function createUpstashClient(): AppRedisClient {
  // Automatically reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  return Redis.fromEnv();
}

export async function getRedisClient(): Promise<RedisResult<AppRedisClient>> {
  const now = Date.now();

  // Check if we are currently in the 5-minute idle/cool-down period after an error
  if (now < errorCoolDownUntil) {
    const remainingSeconds = Math.ceil((errorCoolDownUntil - now) / 1000);
    const customError = new Error(
      `Redis client is idle due to a recent connection error. Retrying in ${Math.ceil(remainingSeconds / 60)} minutes.`
    );
    return { error: parseRedisError(customError, "CONNECT") };
  }

  try {
    if (!cachedRedisClient) {
      cachedRedisClient = createUpstashClient();
    }
    return { data: cachedRedisClient };
  } catch (error) {
    // Trigger the 5-minute cool-down window
    errorCoolDownUntil = Date.now() + COOL_DOWN_DURATION_MS;
    cachedRedisClient = null;

    logRedisError("CONNECT", error);
    return { error: parseRedisError(error, "CONNECT") };
  }
}

export async function disconnectRedis(): Promise<RedisResult<null>> {
  cachedRedisClient = null;
  // Note: Calling disconnect doesn't clear the cool-down timer unless intended, 
  // but you can reset it here if manual resets should bypass the idle state:
  // errorCoolDownUntil = 0;
  return { data: null };
}