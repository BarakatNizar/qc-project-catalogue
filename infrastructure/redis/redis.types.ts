// export type RedisResult<T> =
//   | {
//       data: T;
//     }
//   | {
//       error: string;
//     };

// export type RedisOperation =
//   | "CONNECT"
//   | "GET"
//   | "MGET"
//   | "SET"
//   | "MSET"
//   | "DELETE"
//   | "DISCONNECT"
//   | "SERIALIZE"
//   | "DESERIALIZE";

// export interface RedisJsonEntry<T = unknown> {
//   key: string;
//   value: T;
// }

// @/infrastructure/redis/redis.types.ts
import { Redis } from "@upstash/redis";

export type RedisResult<T> =
  | {
      data: T;
    }
  | {
      error: string;
    };

export type RedisOperation =
  | "CONNECT"
  | "GET"
  | "MGET"
  | "SET"
  | "MSET"
  | "DELETE"
  | "DISCONNECT"
  | "SERIALIZE"
  | "DESERIALIZE";

export interface RedisJsonEntry<T = unknown> {
  key: string;
  value: T;
}

export type AppRedisClient = Redis;