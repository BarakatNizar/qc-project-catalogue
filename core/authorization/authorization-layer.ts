import "server-only";
import type { ServerUser, Role } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";

export type Operation =
  | "SUPERVISOR_MANAGE"
  | "RESET_SUPERVISOR_PASSWORD"
  | "STUDENT_MANAGE"
  | "RESET_STUDENT_PASSWORD"
  | "PROJECT_MANAGE"
  | "PROJECT_READ_HIDDEN"
  | "AI_SETTINGS_MANAGE"
  | "AI_SUGGESTION_DELETE"
  | "AI_PROJECT_EXTRACTION"
  | "AI_SUGGESTION_REQUEST"
  | "PROFILE_MANAGE";

const policy: Record<Operation, Role[]> = {
  SUPERVISOR_MANAGE: ["ADMIN"],
  RESET_SUPERVISOR_PASSWORD:['ADMIN'],
  STUDENT_MANAGE: ["SUPERVISOR"],
  RESET_STUDENT_PASSWORD:['SUPERVISOR'],
  PROJECT_MANAGE: ["SUPERVISOR"],
  PROJECT_READ_HIDDEN: ["SUPERVISOR"],
  AI_SETTINGS_MANAGE: ["ADMIN"],
  AI_SUGGESTION_DELETE: ["SUPERVISOR"],
  AI_PROJECT_EXTRACTION: ["SUPERVISOR"],
  AI_SUGGESTION_REQUEST: ["STUDENT"],
  PROFILE_MANAGE: ["ADMIN", "SUPERVISOR", "STUDENT"],
};

export function authorize(user: ServerUser, operation: Operation) {
  if (!policy[operation].includes(user.role)) throw new AppError("FORBIDDEN");
}

export function authorizeRole(user: ServerUser, roles: Role[]) {
  if (!roles.includes(user.role)) throw new AppError("FORBIDDEN");
}
