export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "AI_DISABLED"
  | "AI_UNAVAILABLE"
  | "INTERNAL";

const safeMessages: Record<AppErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
  UNAUTHORIZED: "You do not have permission to access this information.",
  NOT_FOUND: "The requested item could not be found.",
  VALIDATION: "Please review the information and try again.",
  CONFLICT: "An account or item with that value already exists.",
  AI_DISABLED: "AI suggestions are currently disabled by the administrator.",
  AI_UNAVAILABLE: "AI suggestions are temporarily unavailable. Existing suggestions are still available.",
  INTERNAL: "Something went wrong. Please try again.",
  
};

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode, message?: string, options?: ErrorOptions) {
    super(message ?? safeMessages[code], options);
    this.name = "AppError";
  }
  get safeMessage() { return safeMessages[this.code]; }
}

export function toSafeMessage(error: unknown): string {
  if (error instanceof AppError) return error?.message ?? error?.safeMessage;
  if (error instanceof Error && error.name === "ZodError") return safeMessages.VALIDATION;
  return safeMessages.INTERNAL;
}
