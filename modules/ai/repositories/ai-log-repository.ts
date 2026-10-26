import "server-only";

import { AiExecutionStatus, AiLogLevel, AiOperation, Prisma, type AiProvider } from "@prisma/client";
import { prisma } from "@/infrastructure/database/prisma";
import type { AiOperation as AppAiOperation, AiLogLevel as AppAiLogLevel } from "@/infrastructure/ai/ai-observability";
import type { AiLogsFilters } from "@/shared/validation/ai-logs";

function toDbOperation(operation: AppAiOperation): AiOperation {
  return operation === "suggestions" ? AiOperation.SUGGESTIONS : AiOperation.PROJECT_EXTRACTION;
}

function toDbLevel(level: AppAiLogLevel): AiLogLevel {
  if (level === "error") return AiLogLevel.ERROR;
  if (level === "warn") return AiLogLevel.WARN;
  return AiLogLevel.INFO;
}

export type AiLogAttemptSnapshot = {
  id: string;
  attempt: number;
  providerConfigId: string;
  provider: "OPENROUTER" | "LOCAL";
  providerName: string;
  model: string;
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  providerRequestId?: string;
  httpStatus?: number;
  failureStage?: string;
  failureKind?: string;
  retryable?: boolean;
  providerCode?: string;
  errorName?: string;
  errorCode?: string;
  errorExplanation?: string;
  outputCharacters?: number;
};

export type AiLogEventSnapshot = {
  occurredAt: string;
  level: AppAiLogLevel;
  event: string;
  message?: string;
  attempt?: number;
  details?: Record<string, string | number | boolean>;
};

export type AiLogSnapshot = {
  attempts: AiLogAttemptSnapshot[];
  events: AiLogEventSnapshot[];
  providerTypes: string[];
  level: AppAiLogLevel;
  finalProvider?: AiProvider;
  finalProviderName?: string;
  finalProviderConfigId?: string;
  finalModel?: string;
  metadata?: Record<string, string | number | boolean>;
};

function snapshotJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export const aiLogRepository = {
  create(input: {
    traceId: string;
    operation: AppAiOperation;
    triggeredByUserId: string;
    projectId?: string | null;
  }) {
    return prisma.aiLog.create({
      data: {
        traceId: input.traceId,
        operation: toDbOperation(input.operation),
        status: AiExecutionStatus.RUNNING,
        level: AiLogLevel.INFO,
        triggeredByUserId: input.triggeredByUserId,
        projectId: input.projectId ?? null,
      },
      select: { id: true, traceId: true, operation: true, startedAt: true },
    });
  },

  /** Stores all current diagnostic detail back into the same AiLog row. */
  updateProgress(id: string, snapshot: AiLogSnapshot) {
    return prisma.aiLog.update({
      where: { id },
      data: {
        providerTypes: [...new Set(snapshot.providerTypes)],
        attempts: snapshotJson(snapshot.attempts),
        events: snapshotJson(snapshot.events),
        level: toDbLevel(snapshot.level),
        ...(snapshot.finalProvider !== undefined ? { finalProvider: snapshot.finalProvider } : {}),
        ...(snapshot.finalProviderName !== undefined ? { finalProviderName: snapshot.finalProviderName } : {}),
        ...(snapshot.finalProviderConfigId !== undefined ? { finalProviderConfigId: snapshot.finalProviderConfigId } : {}),
        ...(snapshot.finalModel !== undefined ? { finalModel: snapshot.finalModel } : {}),
        ...(snapshot.metadata !== undefined ? { metadata: snapshotJson(snapshot.metadata) } : {}),
      },
      select: { id: true, traceId: true },
    });
  },

  /** Finalization still updates the same row; no per-attempt/event table is written. */
  finish(input: {
    id: string;
    status: "SUCCEEDED" | "FAILED";
    durationMs: number;
    snapshot: AiLogSnapshot;
    errorCode?: string;
    errorName?: string;
    errorMessage?: string;
    failureStage?: string;
    failureKind?: string;
  }) {
    return prisma.aiLog.update({
      where: { id: input.id },
      data: {
        status: input.status === "SUCCEEDED" ? AiExecutionStatus.SUCCEEDED : AiExecutionStatus.FAILED,
        finishedAt: new Date(),
        durationMs: Math.max(0, Math.trunc(input.durationMs)),
        providerTypes: [...new Set(input.snapshot.providerTypes)],
        attempts: snapshotJson(input.snapshot.attempts),
        events: snapshotJson(input.snapshot.events),
        level: toDbLevel(input.snapshot.level),
        finalProvider: input.snapshot.finalProvider ?? null,
        finalProviderName: input.snapshot.finalProviderName ?? null,
        finalProviderConfigId: input.snapshot.finalProviderConfigId ?? null,
        finalModel: input.snapshot.finalModel ?? null,
        metadata: input.snapshot.metadata ? snapshotJson(input.snapshot.metadata) : Prisma.DbNull,
        errorCode: input.errorCode ?? null,
        errorName: input.errorName ?? null,
        errorMessage: input.errorMessage ?? null,
        failureStage: input.failureStage ?? null,
        failureKind: input.failureKind ?? null,
      },
      select: { id: true, traceId: true, status: true },
    });
  },

  async listLogs(filters: AiLogsFilters) {
    const pageSize = 25;
    const and: Prisma.AiLogWhereInput[] = [];
    const startedAt: Prisma.DateTimeFilter = {};

    if (filters.from) startedAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) {
      const endExclusive = new Date(`${filters.to}T00:00:00.000Z`);
      endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
      startedAt.lt = endExclusive;
    }
    if (Object.keys(startedAt).length > 0) and.push({ startedAt });
    if (filters.level) and.push({ level: filters.level });
    if (filters.operation) and.push({ operation: filters.operation });
    if (filters.status) and.push({ status: filters.status });
    if (filters.provider) and.push({ providerTypes: { has: filters.provider } });

    if (filters.query) {
      and.push({
        OR: [
          { traceId: { contains: filters.query, mode: "insensitive" } },
          { errorCode: { contains: filters.query, mode: "insensitive" } },
          { errorMessage: { contains: filters.query, mode: "insensitive" } },
          { finalProviderName: { contains: filters.query, mode: "insensitive" } },
          { finalModel: { contains: filters.query, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.AiLogWhereInput = and.length ? { AND: and } : {};
    const total = await prisma.aiLog.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(filters.page, totalPages);
    const logs = await prisma.aiLog.findMany({
      where,
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        traceId: true,
        operation: true,
        status: true,
        level: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
        providerTypes: true,
        finalProvider: true,
        finalProviderName: true,
        finalProviderConfigId: true,
        finalModel: true,
        errorCode: true,
        errorName: true,
        errorMessage: true,
        failureStage: true,
        failureKind: true,
        attempts: true,
        events: true,
        metadata: true,
        project: { select: { title: true } },
        triggeredByUser: { select: { name: true } },
      },
    });

    return { logs, total, page, pageSize, totalPages };
  },
};
