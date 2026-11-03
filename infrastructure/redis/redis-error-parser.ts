// import type { RedisOperation } from "./redis.types";

// /**
//  * Converts low-level Redis/client errors into safe, stable messages.
//  * Do not return raw Redis error messages to clients: they can contain
//  * infrastructure details or connection information.
//  */
// export function parseRedisError(
//   error: unknown,
//   operation: RedisOperation,
// ): string {
//   const name =
//     error instanceof Error ? error.name.toLowerCase() : "";
//   const message =
//     error instanceof Error
//       ? error.message.toLowerCase()
//       : typeof error === "string"
//         ? error.toLowerCase()
//         : "";
//   const code =
//     typeof error === "object" && error !== null && "code" in error
//       ? String((error as { code?: unknown }).code).toUpperCase()
//       : "";

//   if (
//     code === "NOAUTH" ||
//     code === "WRONGPASS" ||
//     message.includes("wrongpass") ||
//     message.includes("noauth") ||
//     message.includes("authentication required")
//   ) {
//     return "Redis authentication failed.";
//   }

//   if (
//     name.includes("timeout") ||
//     code === "ETIMEDOUT" ||
//     message.includes("timed out") ||
//     message.includes("timeout")
//   ) {
//     return "Redis command timed out.";
//   }

//   if (
//     code === "ECONNREFUSED" ||
//     code === "ECONNRESET" ||
//     code === "ENOTFOUND" ||
//     code === "EAI_AGAIN" ||
//     name.includes("clientclosed") ||
//     name.includes("socketclosed") ||
//     message.includes("connection is closed") ||
//     message.includes("client is closed") ||
//     message.includes("socket closed")
//   ) {
//     return "Redis is unavailable or disconnected.";
//   }

//   if (operation === "SERIALIZE") {
//     return "Redis cache data could not be serialized.";
//   }

//   if (operation === "DESERIALIZE") {
//     return "Redis cache data is invalid.";
//   }

//   if (operation === "CONNECT") {
//     return "Could not connect to Redis.";
//   }

//   if (operation === "DISCONNECT") {
//     return "Could not close the Redis connection cleanly.";
//   }

//   return "Redis cache operation failed.";
// }

// /** Logs only safe metadata. The original message and connection details are omitted. */
// export function logRedisError(
//   operation: RedisOperation,
//   error: unknown,
// ): void {
//   const errorName = error instanceof Error ? error.name : "UnknownError";
//   const safeMessage = parseRedisError(error, operation);

//   console.error(
//     `[Redis] ${operation} failed: ${safeMessage} (${errorName})`,
//   );
// }











// @/infrastructure/redis/redis-error-parser.ts
import type { RedisOperation } from "./redis.types";

/**
 * Converts low-level Upstash Redis errors into safe, stable messages.
 * Do not return raw Redis error messages to clients.
 */
export function parseRedisError(
  error: unknown,
  operation: RedisOperation,
): string {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === "string"
        ? error.toLowerCase()
        : "";

  if (
    message.includes("wrongpass") ||
    message.includes("noauth") ||
    message.includes("authentication required") ||
    message.includes("unauthorized")
  ) {
    return "Redis authentication failed.";
  }

  if (
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("etimedout")
  ) {
    return "Redis command timed out.";
  }

  if (
    message.includes("fetch failed") ||
    message.includes("networkerror") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("eai_again")
  ) {
    return "Redis is unavailable or disconnected.";
  }

  if (operation === "SERIALIZE") {
    return "Redis cache data could not be serialized.";
  }

  if (operation === "DESERIALIZE") {
    return "Redis cache data is invalid.";
  }

  if (operation === "CONNECT") {
    return "Could not connect to Redis.";
  }

  if (operation === "DISCONNECT") {
    return "Could not close the Redis connection cleanly.";
  }

  return "Redis cache operation failed.";
}

/** Logs only safe metadata. */
export function logRedisError(
  operation: RedisOperation,
  error: unknown,
): void {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const safeMessage = parseRedisError(error, operation);

  console.error(
    `[Redis] ${operation} failed: ${safeMessage} (${errorName})`,
  );
}