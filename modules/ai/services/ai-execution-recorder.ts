import "server-only";

import type { AiProvider } from "@/infrastructure/ai/ai-provider";
import {
  logAiEvent,
  type AiDiagnosticEvent,
  type AiFailureDetails,
  type AiLogLevel,
  type AiOperation,
} from "@/infrastructure/ai/ai-observability";
import { parseAiError } from "@/infrastructure/ai/ai-error-parser";
import { aiLogRepository, type AiLogAttemptSnapshot, type AiLogEventSnapshot, type AiLogSnapshot } from "@/modules/ai/repositories/ai-log-repository";

export type AiExecutionHandle = {
  id: string;
  traceId: string;
  operation: AiOperation;
  startedAt: Date;
  attempts: AiLogAttemptSnapshot[];
  events: AiLogEventSnapshot[];
  providerTypes: string[];
  level: AiLogLevel;
  finalProvider?: "OPENROUTER" | "LOCAL";
  finalProviderName?: string;
  finalProviderConfigId?: string;
  finalModel?: string;
  metadata?: Record<string, string | number | boolean>;
  finished: boolean;
};

export type AiProviderAttemptHandle = AiLogAttemptSnapshot;

const SAFE_DETAIL_KEYS = new Set([
  "operation", "provider", "providerConfigId", "providerName", "model", "attempt", "durationMs",
  "providerRequestId", "failureStage", "failureKind", "retryable", "httpStatus", "providerCode",
  "errorName", "errorCode", "issueCount", "outputCharacters", "suggestionCount", "remainingCapacity",
  "fileSizeBytes", "inputCharacters", "status", "timeoutMs", "providerOrder",
]);

function sanitizeDetails(details?: Record<string, unknown>): Record<string, string | number | boolean> | undefined {
  if (!details) return undefined;
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(details)) {
    if (!SAFE_DETAIL_KEYS.has(key)) continue;
    if (typeof value === "string") safe[key] = value.slice(0, 180);
    else if (typeof value === "number" && Number.isFinite(value)) safe[key] = value;
    else if (typeof value === "boolean") safe[key] = value;
  }
  return Object.keys(safe).length ? safe : undefined;
}

function snapshot(execution: AiExecutionHandle): AiLogSnapshot {
  return {
    attempts: execution.attempts,
    events: execution.events,
    providerTypes: execution.providerTypes,
    level: execution.level,
    finalProvider: execution.finalProvider,
    finalProviderName: execution.finalProviderName,
    finalProviderConfigId: execution.finalProviderConfigId,
    finalModel: execution.finalModel,
    metadata: execution.metadata,
  };
}

function reportRecorderFailure(execution: Pick<AiExecutionHandle, "traceId" | "operation">, error: unknown): void {
  logAiEvent("error", {
    traceId: execution.traceId,
    operation: execution.operation,
    event: "ai_log_write_failed",
    errorName: error instanceof Error ? error.name : "NonErrorThrown",
  });
}

async function persistProgress(execution: AiExecutionHandle): Promise<void> {
  try {
    await aiLogRepository.updateProgress(execution.id, snapshot(execution));
  } catch (error) {
    // Observability errors must not replace the AI operation's result or original error.
    reportRecorderFailure(execution, error);
  }
}

export async function startAiExecution(input: {
  traceId: string;
  operation: AiOperation;
  triggeredByUserId: string;
  projectId?: string | null;
}): Promise<AiExecutionHandle> {
  const row = await aiLogRepository.create(input);
  const execution: AiExecutionHandle = {
    id: row.id,
    traceId: row.traceId,
    operation: input.operation,
    startedAt: row.startedAt,
    attempts: [],
    events: [],
    providerTypes: [],
    level: "info",
    finished: false,
  };

  await recordAiExecutionEvent(execution, {
    level: "info",
    event: "execution_started",
    message: "AI operation started.",
    details: { operation: input.operation },
  });
  // Persist the initial timeline before provider/network work begins.
  await persistProgress(execution);
  return execution;
}

export async function recordAiExecutionEvent(
  execution: AiExecutionHandle,
  event: AiDiagnosticEvent,
  attemptId?: string,
): Promise<void> {
  const relatedAttempt = attemptId ? execution.attempts.find((item) => item.id === attemptId) : undefined;
  const safeDetails = sanitizeDetails(event.details);
  const safeEvent: AiLogEventSnapshot = {
    occurredAt: new Date().toISOString(),
    level: event.level,
    event: event.event.slice(0, 100),
    ...(event.message ? { message: event.message.slice(0, 500) } : {}),
    ...(relatedAttempt ? { attempt: relatedAttempt.attempt } : {}),
    ...(safeDetails ? { details: safeDetails } : {}),
  };
  execution.events.push(safeEvent);
  if (event.level === "error") execution.level = "error";
  else if (event.level === "warn" && execution.level === "info") execution.level = "warn";

  logAiEvent(event.level, {
    traceId: execution.traceId,
    operation: execution.operation,
    event: safeEvent.event,
    attempt: safeEvent.attempt,
    errorName: typeof safeDetails?.errorName === "string" ? safeDetails.errorName : undefined,
    failureStage: typeof safeDetails?.failureStage === "string" ? safeDetails.failureStage as AiFailureDetails["stage"] : undefined,
    failureKind: typeof safeDetails?.failureKind === "string" ? safeDetails.failureKind as AiFailureDetails["kind"] : undefined,
  });
}

export async function startAiProviderAttempt(input: {
  execution: AiExecutionHandle;
  attempt: number;
  provider: AiProvider;
}): Promise<AiProviderAttemptHandle> {
  const attempt: AiProviderAttemptHandle = {
    id: `${input.execution.id}:${input.attempt}`,
    attempt: input.attempt,
    providerConfigId: input.provider.providerConfigId,
    provider: input.provider.providerType,
    providerName: input.provider.providerName,
    model: input.provider.modelName,
    status: "RUNNING",
    startedAt: new Date().toISOString(),
  };
  input.execution.attempts.push(attempt);
  input.execution.providerTypes = [...new Set([...input.execution.providerTypes, input.provider.providerType])];
  await recordAiExecutionEvent(input.execution, {
    level: "info",
    event: "provider_attempt_started",
    message: "AI provider attempt started.",
    details: {
      attempt: attempt.attempt,
      providerConfigId: attempt.providerConfigId,
      provider: attempt.provider,
      providerName: attempt.providerName,
      model: attempt.model,
      providerOrder: input.provider.providerOrder + 1,
    },
  }, attempt.id);
  // Save RUNNING attempt details before contacting the provider. A hanging request
  // remains diagnosable from the single AiLog row.
  await persistProgress(input.execution);
  return attempt;
}

export function createAiRequestContext(execution: AiExecutionHandle, attempt: AiProviderAttemptHandle) {
  return {
    traceId: execution.traceId,
    attempt: attempt.attempt,
    recordEvent: async (event: AiDiagnosticEvent) => recordAiExecutionEvent(execution, event, attempt.id),
  };
}

export async function finishAiProviderAttemptSuccess(
  execution: AiExecutionHandle,
  attempt: AiProviderAttemptHandle,
  details?: { providerRequestId?: string; outputCharacters?: number },
): Promise<void> {
  const finishedAt = new Date();
  attempt.finishedAt = finishedAt.toISOString();
  attempt.durationMs = Math.max(0, finishedAt.getTime() - new Date(attempt.startedAt).getTime());
  attempt.status = "SUCCEEDED";
  if (details?.providerRequestId) attempt.providerRequestId = details.providerRequestId;
  if (details?.outputCharacters !== undefined) attempt.outputCharacters = details.outputCharacters;
  await recordAiExecutionEvent(execution, {
    level: "info",
    event: "provider_attempt_succeeded",
    message: "AI provider attempt completed successfully.",
    details: { attempt: attempt.attempt, durationMs: attempt.durationMs, outputCharacters: attempt.outputCharacters ?? 0 },
  }, attempt.id);
  await persistProgress(execution);
}

export async function finishAiProviderAttemptFailure(
  execution: AiExecutionHandle,
  attempt: AiProviderAttemptHandle,
  error: unknown,
): Promise<void> {
  const finishedAt = new Date();
  const parsed = parseAiError(error);
  attempt.finishedAt = finishedAt.toISOString();
  attempt.durationMs = Math.max(0, finishedAt.getTime() - new Date(attempt.startedAt).getTime());
  attempt.status = "FAILED";
  attempt.errorCode = parsed.code;
  attempt.errorName = parsed.errorName;
  attempt.errorExplanation = parsed.explanation;
  attempt.failureStage = parsed.failureStage;
  attempt.failureKind = parsed.failureKind;
  attempt.retryable = parsed.retryable;
  if (parsed.httpStatus !== undefined) attempt.httpStatus = parsed.httpStatus;
  if (parsed.providerCode !== undefined) attempt.providerCode = parsed.providerCode;

  await recordAiExecutionEvent(execution, {
    level: "warn",
    event: "provider_attempt_failed",
    message: parsed.explanation,
    details: {
      attempt: attempt.attempt,
      providerConfigId: attempt.providerConfigId,
      provider: attempt.provider,
      providerName: attempt.providerName,
      model: attempt.model,
      durationMs: attempt.durationMs,
      errorCode: parsed.code,
      errorName: parsed.errorName,
      failureStage: parsed.failureStage,
      failureKind: parsed.failureKind,
      retryable: parsed.retryable,
      httpStatus: parsed.httpStatus ?? 0,
      providerCode: parsed.providerCode ?? "",
    },
  }, attempt.id);
  if (execution.level !== "error") execution.level = "warn";
  await persistProgress(execution);
}

export async function finishAiExecutionSuccess(
  execution: AiExecutionHandle,
  details?: {
    provider?: "OPENROUTER" | "LOCAL";
    providerConfigId?: string;
    providerName?: string;
    model?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  if (execution.finished) return;
  execution.finished = true;
  execution.finalProvider = details?.provider;
  execution.finalProviderConfigId = details?.providerConfigId;
  execution.finalProviderName = details?.providerName;
  execution.finalModel = details?.model;
  execution.metadata = sanitizeDetails(details?.metadata);
  await recordAiExecutionEvent(execution, {
    level: execution.level,
    event: "execution_succeeded",
    message: "AI operation completed successfully.",
    details: { durationMs: Math.max(0, Date.now() - execution.startedAt.getTime()), ...(details?.metadata ?? {}) },
  });

  try {
    await aiLogRepository.finish({
      id: execution.id,
      status: "SUCCEEDED",
      durationMs: Math.max(0, Date.now() - execution.startedAt.getTime()),
      snapshot: snapshot(execution),
    });
  } catch (error) {
    reportRecorderFailure(execution, error);
  }
}

export async function finishAiExecutionFailure(execution: AiExecutionHandle, error: unknown): Promise<void> {
  if (execution.finished) return;
  execution.finished = true;
  const parsed = parseAiError(error);
  execution.level = "error";
  await recordAiExecutionEvent(execution, {
    level: "error",
    event: "execution_failed",
    message: parsed.explanation,
    details: {
      errorCode: parsed.code,
      errorName: parsed.errorName,
      failureStage: parsed.failureStage,
      failureKind: parsed.failureKind,
      retryable: parsed.retryable,
      httpStatus: parsed.httpStatus ?? 0,
      providerCode: parsed.providerCode ?? "",
      durationMs: Math.max(0, Date.now() - execution.startedAt.getTime()),
    },
  });

  try {
    await aiLogRepository.finish({
      id: execution.id,
      status: "FAILED",
      durationMs: Math.max(0, Date.now() - execution.startedAt.getTime()),
      snapshot: snapshot(execution),
      errorCode: parsed.code,
      errorName: parsed.errorName,
      errorMessage: parsed.explanation,
      failureStage: parsed.failureStage,
      failureKind: parsed.failureKind,
    });
  } catch (writeError) {
    reportRecorderFailure(execution, writeError);
  }
}
