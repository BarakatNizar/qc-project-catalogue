import "server-only";

import type { ServerUser } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { aiLogsFilterSchema, type AiLogsFilterInput } from "@/shared/validation/ai-logs";
import { aiLogRepository } from "@/modules/ai/repositories/ai-log-repository";

/** Admin-only read use case for the single-row-per-execution AI log viewer. */
export const aiLogsService = {
  async getLogs(actor: ServerUser, rawFilters: AiLogsFilterInput) {
    if (actor.role === "STUDENT") throw new AppError("FORBIDDEN");
    const filters = aiLogsFilterSchema.parse(rawFilters);
    return aiLogRepository.listLogs(filters);
  },
};
