import type { AppErrorCode } from "@/core/errors/app-error";

export type Result<T> = { ok: true; data: T } | { ok: false; error: { code: AppErrorCode; message: string } };

export function success<T>(data: T): Result<T> { return { ok: true, data }; }
export function failure<T = never>(code: AppErrorCode, message: string): Result<T> { return { ok: false, error: { code, message } }; }
