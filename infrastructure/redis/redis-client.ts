// // @/infrastructure/redis/redis-client.ts
// import "server-only";

// import { createClient } from "redis";

// import { logRedisError, parseRedisError } from "./redis-error-parser";
// import type { RedisResult } from "./redis.types";

// type RedisClient = ReturnType<typeof createClient>;
// type RedisRuntime = typeof globalThis & {
//   __appRedisClient?: RedisClient;
//   __appRedisConnectPromise?: Promise<RedisResult<RedisClient>>;
//   __appRedisWasConnected?: boolean;
//   __appRedisLastFailedAt?: number;
// };

// const redisRuntime = globalThis as RedisRuntime;

// // Cooldown period (in ms) after a connection failure before trying again
// const REDIS_FAILURE_COOLDOWN_MS = 120_000;

// function createRedisClient(): RedisClient {
//   const url = process.env.REDIS_URL;

//   if (!url) {
//     throw new Error("REDIS_URL is not configured.");
//   }

//   const client = createClient({
//     url,
//     // Cache reads/writes should fail fast instead of being queued while Redis
//     // is disconnected. PostgreSQL remains the source of truth.
//     disableOfflineQueue: true,
//     socket: {
//       // Fail fast (3 seconds instead of 120 seconds) so requests don't hang
//       connectTimeout: 3_000,
//       reconnectStrategy: (retries: number) => {
//         if (retries >= 2) {
//           return false;
//         }
//         return 250;
//       },
//     },
//   });

//   client.on("error", (error: Error) => {
//     logRedisError("CONNECT", error);
//   });

//   client.on("ready", () => {
//     if (redisRuntime.__appRedisClient === client) {
//       redisRuntime.__appRedisWasConnected = true;
//       redisRuntime.__appRedisLastFailedAt = undefined;
//     }
//   });

//   client.on("end", () => {
//     if (redisRuntime.__appRedisClient === client) {
//       redisRuntime.__appRedisClient = undefined;
//       redisRuntime.__appRedisConnectPromise = undefined;
//       redisRuntime.__appRedisWasConnected = false;
//     }
//   });

//   return client as RedisClient;
// }

// function destroyQuietly(client: RedisClient): void {
//   try {
//     if (client.isOpen) {
//       client.destroy();
//     }
//   } catch {
//     // Cleanup must never escape the Redis infrastructure.
//   }
// }

// export async function getRedisClient(): Promise<RedisResult<RedisClient>> {
//   if (!process.env.REDIS_URL) {
//     return { error: "REDIS_URL is not configured." };
//   }

//   // If Redis recently failed, fail fast without attempting a new connection
//   const lastFailedAt = redisRuntime.__appRedisLastFailedAt;
//   if (lastFailedAt && Date.now() - lastFailedAt < REDIS_FAILURE_COOLDOWN_MS) {
//     return { error: "Redis is currently unavailable (cooldown active)." };
//   }

//   let client = redisRuntime.__appRedisClient;

//   if (!client) {
//     try {
//       client = createRedisClient();
//       redisRuntime.__appRedisClient = client;
//     } catch (error) {
//       redisRuntime.__appRedisLastFailedAt = Date.now();
//       return { error: parseRedisError(error, "CONNECT") };
//     }
//   }

//   if (client.isReady) {
//     return { data: client };
//   }

//   if (
//     redisRuntime.__appRedisWasConnected &&
//     !redisRuntime.__appRedisConnectPromise
//   ) {
//     return { error: "Redis is reconnecting. Retry the cache operation." };
//   }

//   if (redisRuntime.__appRedisConnectPromise) {
//     return redisRuntime.__appRedisConnectPromise;
//   }

//   let connectionPromise: Promise<RedisResult<RedisClient>>;

//   connectionPromise = client
//     .connect()
//     .then((): RedisResult<RedisClient> => {
//       redisRuntime.__appRedisLastFailedAt = undefined;
//       return { data: client! };
//     })
//     .catch((error: unknown): RedisResult<RedisClient> => {
//       logRedisError("CONNECT", error);
//       destroyQuietly(client!);

//       if (redisRuntime.__appRedisClient === client) {
//         redisRuntime.__appRedisClient = undefined;
//         redisRuntime.__appRedisWasConnected = false;
//       }

//       redisRuntime.__appRedisLastFailedAt = Date.now();
//       return { error: parseRedisError(error, "CONNECT") };
//     })
//     .finally(() => {
//       if (redisRuntime.__appRedisConnectPromise === connectionPromise) {
//         redisRuntime.__appRedisConnectPromise = undefined;
//       }
//     });

//   redisRuntime.__appRedisConnectPromise = connectionPromise;

//   return connectionPromise;
// }

// export async function disconnectRedis(): Promise<RedisResult<null>> {
//   const client = redisRuntime.__appRedisClient;

//   if (!client) {
//     return { data: null };
//   }

//   try {
//     if (client.isOpen) {
//       await client.quit();
//     }

//     redisRuntime.__appRedisClient = undefined;
//     redisRuntime.__appRedisConnectPromise = undefined;
//     redisRuntime.__appRedisWasConnected = false;
//     redisRuntime.__appRedisLastFailedAt = undefined;

//     return { data: null };
//   } catch (error) {
//     logRedisError("DISCONNECT", error);
//     destroyQuietly(client);
//     redisRuntime.__appRedisClient = undefined;
//     redisRuntime.__appRedisConnectPromise = undefined;
//     redisRuntime.__appRedisWasConnected = false;
//     redisRuntime.__appRedisLastFailedAt = Date.now();

//     return { error: parseRedisError(error, "DISCONNECT") };
//   }
// }
























// @/infrastructure/redis/redis-client.ts
import "server-only";

import { Redis } from "@upstash/redis";

import { logRedisError, parseRedisError } from "./redis-error-parser";
import type { AppRedisClient, RedisResult } from "./redis.types";

let cachedRedisClient: AppRedisClient | null = null;

function createUpstashClient(): AppRedisClient {
  // Automatically reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  return Redis.fromEnv();
}

export async function getRedisClient(): Promise<RedisResult<AppRedisClient>> {
  try {
    if (!cachedRedisClient) {
      cachedRedisClient = createUpstashClient();
    }
    return { data: cachedRedisClient };
  } catch (error) {
    logRedisError("CONNECT", error);
    return { error: parseRedisError(error, "CONNECT") };
  }
}

export async function disconnectRedis(): Promise<RedisResult<null>> {
  // Upstash is stateless over HTTP, so no manual TCP teardown is needed.
  cachedRedisClient = null;
  return { data: null };
}