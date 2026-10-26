// //@/modules/ai/repositories/ai-observability-repository.ts
// import "server-only";

// import {
//   AiAttemptStatus,
//   AiExecutionStatus,
//   AiLogLevel,
//   AiOperation as DbAiOperation,
//   AiProvider as DbAiProvider,
//   Prisma,
// } from "@prisma/client";
// import type { AiExecutionMode, AiProvider } from "@prisma/client";
// import { prisma } from "@/infrastructure/database/prisma";
// import type { AiOperation, AiLogLevel as AppAiLogLevel } from "@/infrastructure/ai/ai-observability";
// import type { AiLogsFilters } from "@/shared/validation/ai-logs";

// function toDbOperation(operation: AiOperation): DbAiOperation {
//   return operation === "suggestions"
//     ? DbAiOperation.SUGGESTIONS
//     : DbAiOperation.PROJECT_EXTRACTION;
// }

// function toDbLogLevel(level: AppAiLogLevel): AiLogLevel {
//   switch (level) {
//     case "info":
//       return AiLogLevel.INFO;
//     case "warn":
//       return AiLogLevel.WARN;
//     case "error":
//       return AiLogLevel.ERROR;
//   }
// }

// export const aiObservabilityRepository = {
//   createExecution(input: {
//     traceId: string;
//     operation: AiOperation;
//     triggeredByUserId: string;
//     projectId?: string | null;
//   }) {
//     return prisma.aiExecution.create({
//       data: {
//         traceId: input.traceId,
//         operation: toDbOperation(input.operation),
//         status: AiExecutionStatus.RUNNING,
//         triggeredByUserId: input.triggeredByUserId,
//         projectId: input.projectId ?? null,
//       },
//       select: {
//         id: true,
//         traceId: true,
//         operation: true,
//         startedAt: true,
//       },
//     });
//   },

//   createAttempt(input: {
//     executionId: string;
//     attempt: number;
//     provider: AiProvider;
//     executionMode: AiExecutionMode;
//     model: string;
//   }) {
//     return prisma.aiProviderAttempt.create({
//       data: {
//         executionId: input.executionId,
//         attempt: input.attempt,
//         provider: input.provider,
//         executionMode: input.executionMode,
//         model: input.model,
//         status: AiAttemptStatus.RUNNING,
//       },
//       select: {
//         id: true,
//         executionId: true,
//         attempt: true,
//         startedAt: true,
//       },
//     });
//   },

//   finishAttempt(input: {
//     id: string;
//     status: "SUCCEEDED" | "FAILED";
//     durationMs: number;
//     providerRequestId?: string;
//     httpStatus?: number;
//     failureStage?: string;
//     failureKind?: string;
//     retryable?: boolean;
//     providerCode?: string;
//     errorName?: string;
//     errorMessage?: string;
//     outputCharacters?: number;
//   }) {
//     return prisma.aiProviderAttempt.update({
//       where: { id: input.id },
//       data: {
//         status:
//           input.status === "SUCCEEDED"
//             ? AiAttemptStatus.SUCCEEDED
//             : AiAttemptStatus.FAILED,
//         finishedAt: new Date(),
//         durationMs: Math.max(0, Math.trunc(input.durationMs)),
//         ...(input.providerRequestId !== undefined ? { providerRequestId: input.providerRequestId } : {}),
//         ...(input.httpStatus !== undefined ? { httpStatus: input.httpStatus } : {}),
//         ...(input.failureStage !== undefined ? { failureStage: input.failureStage } : {}),
//         ...(input.failureKind !== undefined ? { failureKind: input.failureKind } : {}),
//         ...(input.retryable !== undefined ? { retryable: input.retryable } : {}),
//         ...(input.providerCode !== undefined ? { providerCode: input.providerCode } : {}),
//         ...(input.errorName !== undefined ? { errorName: input.errorName } : {}),
//         ...(input.errorMessage !== undefined ? { errorMessage: input.errorMessage } : {}),
//         ...(input.outputCharacters !== undefined ? { outputCharacters: input.outputCharacters } : {}),
//       },
//       select: { id: true, executionId: true, attempt: true, status: true },
//     });
//   },

//   createEvent(input: {
//     executionId: string;
//     attemptId?: string | null;
//     level: AppAiLogLevel;
//     event: string;
//     message?: string;
//     details?: Record<string, string | number | boolean>;
//   }) {
//     return prisma.aiLogEvent.create({
//       data: {
//         executionId: input.executionId,
//         attemptId: input.attemptId ?? null,
//         level: toDbLogLevel(input.level),
//         event: input.event,
//         ...(input.message ? { message: input.message.slice(0, 500) } : {}),
//         ...(input.details
//           ? { details: input.details as Prisma.InputJsonValue }
//           : {}),
//       },
//       select: { id: true, occurredAt: true },
//     });
//   },


//   async listLogs(filters: AiLogsFilters) {
//     const pageSize = 25;
//     const and: Prisma.AiLogEventWhereInput[] = [];

//     const occurredAt: Prisma.DateTimeFilter = {};
//     if (filters.from) {
//       occurredAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
//     }
//     if (filters.to) {
//       const endExclusive = new Date(`${filters.to}T00:00:00.000Z`);
//       endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
//       occurredAt.lt = endExclusive;
//     }
//     if (Object.keys(occurredAt).length > 0) {
//       and.push({ occurredAt });
//     }

//     if (filters.level) {
//       and.push({ level: filters.level });
//     }

//     const executionWhere: Prisma.AiExecutionWhereInput = {};
//     if (filters.operation) executionWhere.operation = filters.operation;
//     if (filters.status) executionWhere.status = filters.status;
//     if (filters.provider) {
//       executionWhere.attempts = {
//         some: { provider: filters.provider as DbAiProvider },
//       };
//       // When a provider is selected, show events from that provider's attempts
//       // as well as execution-level events which have no specific attempt.
//       and.push({
//         OR: [
//           { attempt: { is: { provider: filters.provider as DbAiProvider } } },
//           { attemptId: null },
//         ],
//       });
//     }
//     if (Object.keys(executionWhere).length > 0) {
//       and.push({ execution: { is: executionWhere } });
//     }

//     if (filters.query) {
//       and.push({
//         OR: [
//           { event: { contains: filters.query, mode: "insensitive" } },
//           { message: { contains: filters.query, mode: "insensitive" } },
//           {
//             execution: {
//               is: {
//                 traceId: { contains: filters.query, mode: "insensitive" },
//               },
//             },
//           },
//         ],
//       });
//     }

//     const where: Prisma.AiLogEventWhereInput = and.length > 0 ? { AND: and } : {};
//     const total = await prisma.aiLogEvent.count({ where });
//     const totalPages = Math.max(1, Math.ceil(total / pageSize));
//     const page = Math.min(filters.page, totalPages);

//     const events = await prisma.aiLogEvent.findMany({
//       where,
//       orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
//       skip: (page - 1) * pageSize,
//       take: pageSize,
//       select: {
//         id: true,
//         occurredAt: true,
//         level: true,
//         event: true,
//         message: true,
//         details: true,
//         execution: {
//           select: {
//             traceId: true,
//             operation: true,
//             status: true,
//             startedAt: true,
//             durationMs: true,
//             project: { select: { title: true } },
//             triggeredByUser: { select: { name: true } },
//           },
//         },
//         attempt: {
//           select: {
//             id: true,
//             attempt: true,
//             provider: true,
//             executionMode: true,
//             model: true,
//             status: true,
//             durationMs: true,
//             httpStatus: true,
//             failureStage: true,
//             failureKind: true,
//             retryable: true,
//             providerRequestId: true,
//           },
//         },
//       },
//     });

//     return {
//       events,
//       total,
//       page,
//       pageSize,
//       totalPages,
//     };
//   },

//   finishExecution(input: {
//     id: string;
//     status: "SUCCEEDED" | "FAILED";
//     durationMs: number;
//     errorCode?: string;
//     errorName?: string;
//     errorMessage?: string;
//     failureStage?: string;
//     failureKind?: string;
//   }) {
//     return prisma.aiExecution.update({
//       where: { id: input.id },
//       data: {
//         status:
//           input.status === "SUCCEEDED"
//             ? AiExecutionStatus.SUCCEEDED
//             : AiExecutionStatus.FAILED,
//         finishedAt: new Date(),
//         durationMs: Math.max(0, Math.trunc(input.durationMs)),
//         errorCode: input.errorCode ?? null,
//         errorName: input.errorName ?? null,
//         errorMessage: input.errorMessage ?? null,
//         failureStage: input.failureStage ?? null,
//         failureKind: input.failureKind ?? null,
//       },
//       select: { id: true, traceId: true, status: true },
//     });
//   },
// };
