// // modules/ai/services/ai-service.ts

// import "server-only";

// import type { ServerUser } from "@/core/auth/session";
// import { authorize } from "@/core/authorization/authorization-layer";
// import { AppError } from "@/core/errors/app-error";
// import {
//   aiSuggestionResponseSchema,
//   requestAiSuggestionsSchema,
//   deleteAiSuggestionSchema,
//   type AiSuggestionResponsePayload,
// } from "@/shared/validation/ai";
// import { extractedProjectResponseSchema } from "@/shared/validation/project-extraction";
// import { projectRepository } from "@/modules/project/repositories/project-repository";
// import { aiRepository } from "@/modules/ai/repositories/ai-repository";
// import { runWithOrderedProviders } from "@/modules/ai/services/ai-provider-runner";
// import {
//   startAiExecution,
//   finishAiExecutionFailure,
//   finishAiExecutionSuccess,
//   recordAiExecutionEvent,
// } from "@/modules/ai/services/ai-execution-recorder";
// import { normalizeSuggestion, removeExactDuplicates } from "@/shared/utils/normalize-suggestion";
// import mammoth from "mammoth";
// import { getDocumentProxy, extractText } from "unpdf";
// import type { ExtractedProject, ProjectSuggestions } from "@/modules/project/types";
// import { Language, Prisma } from "@prisma/client";

// const MAX_SUGGESTIONS_PER_PROJECT = 10;
// const MIN_SUGGESTIONS_PER_GENERATION = 3;
// const MAX_SUGGESTIONS_PER_GENERATION = 4;
// const MAX_EXTRACTION_FILE_BYTES = 10 * 1024 * 1024;
// const MAX_EXTRACTED_TEXT_CHARACTERS = 150_000;

// type ValidationResult<T> =
//   | { success: true; data: T }
//   | { success: false; issueCount: number ; issues?:any};

// function makeInput(project: NonNullable<Awaited<ReturnType<typeof projectRepository.findAiContextById>>>) {
//   return {
//     project: {
//       title: project.title,
//       summary: project.summary,
//       description: project.description,
//       problemStatement: project.problemStatement,
//       proposedSolution: project.proposedSolution,
//       targetUsers:project.targetUsers,
//       availableResources:project.availableResources,
//       constraints:project.constraints,
//       objectives: project.objectives,
//       projectType: project.projectType,
//       projectSupervisorName: project.projectSupervisorName,
//       features: project.features.map((feature) => ({ content: feature.content, scope: feature.scope })),
//       technologies: project.technologies.map((technology) => ({ name: technology.name })),
//       existingSuggestions: project.suggestions.map((suggestion) => ({
//         content: suggestion.content,
//         title: suggestion.title,
//       })),
//     },
//   };
// }

// function validateSuggestionPayload(payload: unknown): ValidationResult<AiSuggestionResponsePayload> {
//   const parsed = aiSuggestionResponseSchema.safeParse(payload);
//   return parsed.success ? { success: true, data: parsed.data } : { success: false, issueCount: parsed.error.issues.length };
// }

// function validateExtractionPayload(payload: unknown): ValidationResult<ExtractedProject> {
//   // console.log(payload);
//   const parsed = extractedProjectResponseSchema.safeParse(payload);
//   return parsed.success ? { success: true, data: parsed.data } : { success: false, issueCount: parsed.error.issues.length , issues: parsed.error.issues.map((issue) => ({
//     path: issue.path,
//     code: issue.code,
//     message: issue.message,
//     expected: "expected" in issue ? issue.expected : undefined,
//     received: "received" in issue ? issue.received : undefined,
//   }))
// };
// }

// async function parseFileToText(file: File): Promise<string> {
//   if (file.size <= 0) throw new AppError("VALIDATION", "The uploaded file is empty.");
//   if (file.size > MAX_EXTRACTION_FILE_BYTES) {
//     throw new AppError("VALIDATION", "The uploaded file exceeds the 10 MB limit.");
//   }

//   const buffer = Buffer.from(await file.arrayBuffer());
//   const mimeType = file.type;
//   const fileName = file.name.toLowerCase();
//   let text: string;

//   if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
//     text = buffer.toString("utf-8");
//   } else if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
//     try {
//       const pdf = await getDocumentProxy(new Uint8Array(buffer));
//       const result = await extractText(pdf, { mergePages: true });
//       text = result.text;
//     } catch {
//       throw new AppError("VALIDATION", "Failed to parse the PDF file. Ensure it is not password-protected or corrupted.");
//     }
//   } else if (
//     mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
//     fileName.endsWith(".docx")
//   ) {
//     try {
//       const parsed = await mammoth.extractRawText({ buffer });
//       text = parsed.value;
//     } catch {
//       throw new AppError("VALIDATION", "Failed to parse the Word document.");
//     }
//   } else {
//     throw new AppError("VALIDATION", "Unsupported file format. Please upload PDF, Word (.docx), or Text (.txt).");
//   }

//   if (text.length > MAX_EXTRACTED_TEXT_CHARACTERS) {
//     throw new AppError("VALIDATION", "The extracted text exceeds the supported length. Reduce the document size and try again.");
//   }
//   return text;
// }

// export const aiService = {
//   async getSettings(actor: ServerUser) {
//     if (actor.role !== "ADMIN" && actor.role !== "SUPERVISOR") throw new AppError("FORBIDDEN");
//     const settings = await aiRepository.getSettings();
//     return { enabled: settings.enabled, updatedAt: settings.updatedAt };
//   },

//   async getPublicSettings() {
//     const settings = await aiRepository.getSettings();
//     return { enabled: settings.enabled };
//   },

//   async setEnabled(actor: ServerUser, enabled: boolean) {
//     authorize(actor, "AI_SETTINGS_MANAGE");
//     return aiRepository.setEnabled(enabled);
//   },

//   async listSuggestions(actor: ServerUser, projectId: string, locale:Language ) {
//     if (actor.role !== "STUDENT" && actor.role !== "SUPERVISOR") throw new AppError("FORBIDDEN");
//     const { projectId: validatedProjectId } = requestAiSuggestionsSchema.parse({ projectId });
//     const project = await projectRepository.findById(validatedProjectId);
//     if (!project || (actor.role === "STUDENT" && project.visibility !== "VISIBLE")) throw new AppError("NOT_FOUND");
//     const suggestions = await aiRepository.listSuggestions(validatedProjectId);
//     const data:ProjectSuggestions={
//       language:locale,
//       projectId,
//       suggestions
//     }
//     return data;

//   },

//   async requestSuggestions(actor: ServerUser, raw: unknown, traceId: string) {
//     authorize(actor, "AI_SUGGESTION_REQUEST");
//     const { projectId } = requestAiSuggestionsSchema.parse(raw);
//     const [settings, project] = await Promise.all([
//       aiRepository.getSettings(),
//       projectRepository.findAiContextById(projectId),
//     ]);

//     if (!project || project.visibility !== "VISIBLE") throw new AppError("NOT_FOUND");
//     if (!settings.enabled) throw new AppError("AI_DISABLED", "AI suggestion generation is disabled by an administrator.");
//     if (!project.title.trim() || !project.description.trim()) {
//       throw new AppError("VALIDATION", "The project brief needs a title and description before AI suggestions can be generated.");
//     }

//     const remainingCapacity = MAX_SUGGESTIONS_PER_PROJECT - project.suggestions.length;
//     if (remainingCapacity < MIN_SUGGESTIONS_PER_GENERATION) {
//       throw new AppError("AI_UNAVAILABLE", "No more suggestions can be generated.");
//     }

//     const execution = await startAiExecution({
//       traceId,
//       operation: "suggestions",
//       triggeredByUserId: actor.id,
//       projectId,
//     });

//     try {
//       const input = makeInput(project);
//       const result = await runWithOrderedProviders<AiSuggestionResponsePayload>(execution, {
//         invoke: (provider, context) => provider.generateSuggestions(input, context),
//         validate: validateSuggestionPayload,
//       });

//       const generated = removeExactDuplicates(project.suggestions, result.payload.suggestions)
//         .slice(0, Math.min(MAX_SUGGESTIONS_PER_GENERATION, remainingCapacity));

//       if (generated.length < MIN_SUGGESTIONS_PER_GENERATION) {
//         await recordAiExecutionEvent(execution, {
//           level: "error",
//           event: "suggestion_postprocessing_failed",
//           message: "Too few distinct new suggestions remained after duplicate removal.",
//           details: { suggestionCount: generated.length, remainingCapacity },
//         });
//         throw new AppError("AI_UNAVAILABLE", "The model did not produce enough distinct new suggestions. Please try again.");
//       }

//       let persisted: Awaited<ReturnType<typeof aiRepository.persistGeneration>>;
//       try {
//         persisted = await aiRepository.persistGeneration({
//           aiLogId: execution.id,
//           providerConfigId: result.providerConfigId,
//           projectId,
//           triggeredByUserId: actor.id,
//           provider: result.provider,
//           model: result.model,
//           responseContent: {
//             suggestions: generated.map((suggestion) => ({ content: suggestion.content, title: suggestion.title })),
//           },
//           suggestions: generated,
//         });
//       } catch (error) {
//         if (error instanceof Prisma.PrismaClientKnownRequestError) {
//           throw new AppError("INTERNAL", "The suggestions could not be saved.", { cause: error });
//         }
//         throw error;
//       }

//       await finishAiExecutionSuccess(execution, {
//         provider: result.provider,
//         providerConfigId: result.providerConfigId,
//         providerName: result.providerName,
//         model: result.model,
//         metadata: { suggestionCount: generated.length, remainingCapacity },
//       });

//       return {
//         data: {
//           responseId: persisted.responseId,
//           suggestions: persisted.suggestions,
//           provider: result.provider,
//           providerName: result.providerName,
//           model: result.model,
//         },
//       };
//     } catch (error) {
//       await finishAiExecutionFailure(execution, error);
//       throw error;
//     }
//   },

//   async deleteSuggestion(actor: ServerUser, suggestionId: string) {
//     authorize(actor, "AI_SUGGESTION_DELETE");
//     const { suggestionId: validatedSuggestionId } = deleteAiSuggestionSchema.parse({ suggestionId });
//     try {
//       return await aiRepository.deleteSuggestion(validatedSuggestionId);
//     } catch (error) {
//       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
//         throw new AppError("NOT_FOUND");
//       }
//       throw error;
//     }
//   },

//   async extractProjectFromFile(actor: ServerUser, file: File, traceId: string): Promise<ExtractedProject> {
//     if (actor.role !== "ADMIN" && actor.role !== "SUPERVISOR" && actor.role !== "STUDENT") {
//       throw new AppError("FORBIDDEN");
//     }

//     const execution = await startAiExecution({
//       traceId,
//       operation: "project_extraction",
//       triggeredByUserId: actor.id,
//       projectId: null,
//     });

//     try {
//       const settings = await aiRepository.getSettings();
//       if (!settings.enabled) throw new AppError("AI_DISABLED", "AI features are disabled by an administrator.");

//       const documentText = await parseFileToText(file);
//       if (!documentText.trim()) throw new AppError("VALIDATION", "The uploaded document contains no readable text.");

//       await recordAiExecutionEvent(execution, {
//         level: "info",
//         event: "document_text_extracted",
//         message: "Document text extraction completed.",
//         details: { fileSizeBytes: file.size, inputCharacters: documentText.length },
//       });

//       const result = await runWithOrderedProviders<ExtractedProject>(execution, {
//         invoke: (provider, context) => provider.extractProjectData(documentText, context),
//         validate: validateExtractionPayload,
//       });

//       await finishAiExecutionSuccess(execution, {
//         provider: result.provider,
//         providerConfigId: result.providerConfigId,
//         providerName: result.providerName,
//         model: result.model,
//         metadata: { operation: "project_extraction", inputCharacters: documentText.length },
//       });
//       return result.payload;
//     } catch (error) {
//       await finishAiExecutionFailure(execution, error);
//       throw error;
//     }
//   },
// };

// export const normalizeAiSuggestion = normalizeSuggestion;

// modules/ai/services/ai-service.ts

import "server-only";

import type { ServerUser } from "@/core/auth/session";
import { authorize } from "@/core/authorization/authorization-layer";
import { AppError, toSafeMessage } from "@/core/errors/app-error";
import {
  aiSuggestionResponseSchema,
  requestAiSuggestionsSchema,
  deleteAiSuggestionSchema,
  type AiSuggestionResponsePayload,
} from "@/shared/validation/ai";
import { extractedProjectResponseSchema } from "@/shared/validation/project-extraction";
import { projectRepository } from "@/modules/project/repositories/project-repository";
import { aiRepository } from "@/modules/ai/repositories/ai-repository";
import { projectCacheService } from "@/modules/project/cache/project-cache.service";
import { projectTranslationService } from "@/modules/translation/services/project-translation.service";
import type { TranslationLanguage } from "@/modules/translation/types/translation.types";
import { runWithOrderedProviders } from "@/modules/ai/services/ai-provider-runner";
import {
  startAiExecution,
  finishAiExecutionFailure,
  finishAiExecutionSuccess,
  recordAiExecutionEvent,
} from "@/modules/ai/services/ai-execution-recorder";
import { normalizeSuggestion, removeExactDuplicates } from "@/shared/utils/normalize-suggestion";
import mammoth from "mammoth";
import { getDocumentProxy, extractText } from "unpdf";
import type { ExtractedProject, ProjectSuggestions, Suggestion } from "@/modules/project/types";
import { Prisma, type Language } from "@prisma/client";

const MAX_SUGGESTIONS_PER_PROJECT = 10;
const MIN_SUGGESTIONS_PER_GENERATION = 3;
const MAX_SUGGESTIONS_PER_GENERATION = 4;
const MAX_EXTRACTION_FILE_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_CHARACTERS = 150_000;

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issueCount: number; issues?: unknown };

function toTranslationLanguage(language: unknown): TranslationLanguage | null {
  if (typeof language !== "string") return null;
  const normalized = language.trim().toLowerCase();
  return normalized === "en" || normalized === "ar" ? normalized : null;
}

function logSuggestionCacheWarning(operation: string, error: string): void {
  console.warn(`[AI] Suggestion cache ${operation} failed: ${error}`);
}

function logSuggestionTranslationWarning(error: string): void {
  console.warn(
    `[AI] Suggestion translation failed; returning original suggestions: ${error}`,
  );
}

function makeInput(
  project: NonNullable<Awaited<ReturnType<typeof projectRepository.findAiContextById>>>,
) {
  return {
    project: {
      language: project.language, //"en" | "ar"
      title: project.title,
      summary: project.summary,
      description: project.description,
      problemStatement: project.problemStatement,
      proposedSolution: project.proposedSolution,
      objectives: project.objectives,
      targetUsers: project.targetUsers,
      constraints: project.constraints,
      availableResources: project.availableResources,
      projectType: project.projectType,
      features: project.features.map((feature) => ({
        content: feature.content,
        scope: feature.scope,
      })),
      technologies: project.technologies.map((technology) => ({
        name: technology.name,
      })),
      existingSuggestions: project.suggestions.map((suggestion) => ({
        content: suggestion.content,
        title: suggestion.title,
      })),
    },
  };
}

function validateSuggestionPayload(
  payload: unknown,
): ValidationResult<AiSuggestionResponsePayload> {
  const parsed = aiSuggestionResponseSchema.safeParse(payload);
  return parsed.success
    ? { success: true, data: parsed.data }
    : { success: false, issueCount: parsed.error.issues.length };
}

function validateExtractionPayload(payload: unknown,): ValidationResult<ExtractedProject> {
  const parsed = extractedProjectResponseSchema.safeParse(payload);
  return parsed.success
    ? { success: true, data: parsed.data }
    : {
      success: false,
      issueCount: parsed.error.issues.length,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path,
        code: issue.code,
        message: issue.message,
        expected: "expected" in issue ? issue.expected : undefined,
        received: "received" in issue ? issue.received : undefined,
      })),
    };
}

async function readCachedSuggestions(
  projectId: string,
  language: TranslationLanguage,
): Promise<ProjectSuggestions | null> {
  try {
    const result =
      await projectCacheService.getCachedProjectSuggestionLocalized(
        projectId,
        language,
      );

    if ("error" in result) {
      logSuggestionCacheWarning("read", result.error);
      return null;
    }

    const cached = result.data;
    if (!cached) return null;

    if (cached.projectId !== projectId || cached.language !== language) {
      logSuggestionCacheWarning(
        "read",
        "Cached suggestions contained a mismatched project ID or language.",
      );
      await invalidateSuggestionCache(projectId, [language]);
      return null;
    }

    return cached;
  } catch (error) {
    logSuggestionCacheWarning(
      "read",
      error instanceof Error ? error.message : "Unexpected cache read error.",
    );
    return null;
  }
}

async function writeCachedSuggestions(
  suggestions: ProjectSuggestions,
): Promise<void> {
  try {
    const cacheValue = {
      projectId: suggestions.projectId,
      suggestions: suggestions.suggestions,
    };

    const result =
      suggestions.language === "en"
        ? await projectCacheService.setCachedProjectSuggestionsEn({
          suggestions: cacheValue,
        })
        : await projectCacheService.setCachedProjectSuggestionsAr({
          suggestions: cacheValue,
        });

    if (!result.ok) {
      logSuggestionCacheWarning("write", result.error);
    }
  } catch (error) {
    logSuggestionCacheWarning(
      "write",
      error instanceof Error ? error.message : "Unexpected cache write error.",
    );
  }
}

async function invalidateSuggestionCache(
  projectId: string,
  languages: TranslationLanguage[] = ["en", "ar"],
): Promise<void> {
  try {
    const result = await projectCacheService.invalidateProjectResources(
      projectId,
      ["suggestions"],
      languages,
    );

    if (!result.ok) {
      logSuggestionCacheWarning("invalidation", result.error);
    }
  } catch (error) {
    logSuggestionCacheWarning(
      "invalidation",
      error instanceof Error
        ? error.message
        : "Unexpected cache invalidation error.",
    );
  }
}

/**
 * Suggestion mutations also change ProjectListItem.counts.suggestions, so both
 * the suggestions resources and both localized list items must be invalidated.
 */
async function invalidateSuggestionAndListCaches(
  projectId: string,
): Promise<void> {
  try {
    const result = await projectCacheService.invalidateProjectResources(
      projectId,
      ["suggestions", "list"],
    );

    if (!result.ok) {
      logSuggestionCacheWarning("suggestion/list invalidation", result.error);
    }
  } catch (error) {
    logSuggestionCacheWarning(
      "suggestion/list invalidation",
      error instanceof Error
        ? error.message
        : "Unexpected cache invalidation error.",
    );
  }
}

function isMatchingTranslatedSuggestions(
  source: ProjectSuggestions,
  translated: ProjectSuggestions,
  targetLanguage: TranslationLanguage,
): boolean {
  return (
    translated.projectId === source.projectId &&
    translated.language === targetLanguage &&
    translated.suggestions.length === source.suggestions.length &&
    translated.suggestions.every(
      (suggestion, index) => suggestion.id === source.suggestions[index]?.id,
    )
  );
}

/**
 * Rebuilds the source-language suggestions cache after AI generation.
 * Both localized suggestion entries and list-item counts are invalidated;
 * the current source-language suggestions are then written back to Redis.
 */
async function refreshSuggestionCacheAfterGeneration(
  projectId: string,
): Promise<void> {
  try {
    const [project, suggestions] = await Promise.all([
      projectRepository.findById(projectId),
      aiRepository.listSuggestions(projectId),
    ]);

    if (!project) {
      await invalidateSuggestionAndListCaches(projectId);
      return;
    }

    const sourceLanguage = toTranslationLanguage(project.language);
    if (!sourceLanguage) {
      console.warn(
        `[AI] Project ${projectId} has an unsupported source language; invalidating suggestion and list caches.`,
      );
      await invalidateSuggestionAndListCaches(projectId);
      return;
    }

    // Remove stale localized suggestions and list counts in both languages,
    // then write the current source-language suggestions. Cache failures must
    // not fail the successful AI generation.
    await invalidateSuggestionAndListCaches(projectId);
    await writeCachedSuggestions({
      projectId,
      language: sourceLanguage,
      suggestions,
    });
  } catch (error) {
    console.warn(
      `[AI] Could not refresh suggestion cache after generation for project ${projectId}.`,
      error instanceof Error ? error.message : "Unexpected cache refresh error.",
    );
    await invalidateSuggestionAndListCaches(projectId);
  }
}

function extractProjectIdFromDeleteResult(
  value: unknown,
  depth = 0,
): string | null {
  if (depth > 3 || typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  if (typeof record.projectId === "string" && record.projectId.trim()) {
    return record.projectId;
  }

  for (const key of ["data", "suggestion", "deletedSuggestion", "record"]) {
    const nested = extractProjectIdFromDeleteResult(record[key], depth + 1);
    if (nested) return nested;
  }

  return null;
}

async function parseFileToText(file: File): Promise<string> {
  if (file.size <= 0) {
    throw new AppError("VALIDATION", "The uploaded file is empty.");
  }
  if (file.size > MAX_EXTRACTION_FILE_BYTES) {
    throw new AppError("VALIDATION", "The uploaded file exceeds the 10 MB limit.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;
  const fileName = file.name.toLowerCase();
  let text: string;

  if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
    text = buffer.toString("utf-8");
  } else if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      text = result.text;
    } catch {
      throw new AppError(
        "VALIDATION",
        "Failed to parse the PDF file. Ensure it is not password-protected or corrupted.",
      );
    }
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    try {
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value;
    } catch {
      throw new AppError("VALIDATION", "Failed to parse the Word document.");
    }
  } else {
    throw new AppError(
      "VALIDATION",
      "Unsupported file format. Please upload PDF, Word (.docx), or Text (.txt).",
    );
  }

  if (text.length > MAX_EXTRACTED_TEXT_CHARACTERS) {
    throw new AppError(
      "VALIDATION",
      "The extracted text exceeds the supported length. Reduce the document size and try again.",
    );
  }

  return text;
}
type ServiceError = { error: string };
type ServiceSuccess = { ok: true };



function toServiceError(error: unknown): ServiceError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    appError = new AppError("CONFLICT");
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    appError = new AppError("NOT_FOUND");
  } else {
    appError = new AppError("INTERNAL");
  }

  return { error: toSafeMessage(appError) };
}



export const aiService = {
  async getSettings(actor: ServerUser) {
    try {
      if (actor.role !== "ADMIN" && actor.role !== "SUPERVISOR") {
        throw new AppError("FORBIDDEN");
      }
      const settings = await aiRepository.getSettings();
      return { enabled: settings.enabled, updatedAt: settings.updatedAt };

    } catch (error) {
      return toServiceError(error);
    }
  },

  async getPublicSettings() {
    try {
      const settings = await aiRepository.getSettings();
      return { enabled: settings.enabled };
    } catch (error) {
      return toServiceError(error);
    }
  },

  async setEnabled(actor: ServerUser, enabled: boolean):Promise<{ok:true}|ServiceError> {
    try {
      authorize(actor, "AI_SETTINGS_MANAGE");
      await aiRepository.setEnabled(enabled);
      return {ok:true}
    } catch (error) {
      return toServiceError(error);
    }
  },

  async listSuggestions(actor: ServerUser, projectId: string, locale: Language,): Promise<{ data: ProjectSuggestions } | ServiceError> {
    try {

      if (actor.role !== "STUDENT" && actor.role !== "SUPERVISOR") {
        throw new AppError("FORBIDDEN");
      }

      const { projectId: validatedProjectId } = requestAiSuggestionsSchema.parse({
        projectId,
      });
      const targetLanguage = toTranslationLanguage(locale);
      if (!targetLanguage) {
        throw new AppError("VALIDATION", "The requested language is not supported.");
      }

      // This database lookup remains authoritative for project existence and
      // student visibility. A cache hit must never bypass this access check. s
      const project = await projectRepository.findById(validatedProjectId);
      if (!project || (actor.role === "STUDENT" && project.visibility !== "VISIBLE")) {
        throw new AppError("NOT_FOUND");
      }

      const sourceLanguage = toTranslationLanguage(project.language);
      if (!sourceLanguage) {
        throw new AppError(
          "VALIDATION",
          "The project's source language is not supported for suggestions.",
        );
      }

      // First try the requested language. This is the normal cache-hit path.
      const cachedTarget = await readCachedSuggestions(
        validatedProjectId,
        targetLanguage,
      );
      if (cachedTarget) return { data: cachedTarget };

      // If the requested language is missing, reuse the source-language cache
      // before querying the suggestions repository.
      let sourceSuggestions =
        sourceLanguage === targetLanguage
          ? null
          : await readCachedSuggestions(validatedProjectId, sourceLanguage);

      if (!sourceSuggestions) {
        const suggestions = await aiRepository.listSuggestions(validatedProjectId);
        sourceSuggestions = {
          projectId: validatedProjectId,
          language: sourceLanguage,
          suggestions,
        };
        await writeCachedSuggestions(sourceSuggestions);
      }

      if (sourceLanguage === targetLanguage) {
        return { data: sourceSuggestions };
      }

      try {
        const translatedResult =
          await projectTranslationService.translateProjectSuggestions(
            sourceSuggestions,
            targetLanguage,
          );

        if ("error" in translatedResult) {
          logSuggestionTranslationWarning(translatedResult.error);
          return { data: sourceSuggestions };
        }

        if (
          !isMatchingTranslatedSuggestions(
            sourceSuggestions,
            translatedResult.data,
            targetLanguage,
          )
        ) {
          logSuggestionTranslationWarning(
            "Translation returned mismatched project data or an incomplete suggestion list.",
          );
          return { data: sourceSuggestions };
        }

        await writeCachedSuggestions(translatedResult.data);
        return { data: translatedResult.data };
      } catch (error) {
        logSuggestionTranslationWarning(
          error instanceof Error ? error.message : "Unexpected translation error.",
        );
        return { data: sourceSuggestions };
      }

    } catch (error) {
      return toServiceError(error);
    }
  },

  async requestSuggestions(actor: ServerUser, raw: unknown, traceId: string): Promise<{ data: Suggestion[] } | ServiceError> {
    try {
      authorize(actor, "AI_SUGGESTION_REQUEST");
      const { projectId } = requestAiSuggestionsSchema.parse(raw);
      const [settings, project] = await Promise.all([
        aiRepository.getSettings(),
        projectRepository.findAiContextById(projectId),
      ]);

      if (!project || project.visibility !== "VISIBLE") {
        throw new AppError("NOT_FOUND");
      }
      if (!settings.enabled) {
        throw new AppError(
          "AI_DISABLED",
          "AI suggestion generation is disabled by an administrator.",
        );
      }
      if (!project.title.trim() || !project.description.trim()) {
        throw new AppError(
          "VALIDATION",
          "The project brief needs a title and description before AI suggestions can be generated.",
        );
      }

      const remainingCapacity = MAX_SUGGESTIONS_PER_PROJECT - project.suggestions.length;
      if (remainingCapacity < MIN_SUGGESTIONS_PER_GENERATION) {
        throw new AppError("AI_UNAVAILABLE", "No more suggestions can be generated.");
      }

      const execution = await startAiExecution({
        traceId,
        operation: "suggestions",
        triggeredByUserId: actor.id,
        projectId,
      });

      try {
        const input = makeInput(project);
        const result = await runWithOrderedProviders<AiSuggestionResponsePayload>(
          execution,
          {
            invoke: (provider, context) =>
              provider.generateSuggestions(input, context),
            validate: validateSuggestionPayload,
          },
        );

        const generated = removeExactDuplicates(
          project.suggestions,
          result.payload.suggestions,
        ).slice(0, Math.min(MAX_SUGGESTIONS_PER_GENERATION, remainingCapacity));

        if (generated.length < MIN_SUGGESTIONS_PER_GENERATION) {
          await recordAiExecutionEvent(execution, {
            level: "error",
            event: "suggestion_postprocessing_failed",
            message: "Too few distinct new suggestions remained after duplicate removal.",
            details: { suggestionCount: generated.length, remainingCapacity },
          });
          throw new AppError(
            "AI_UNAVAILABLE",
            "The model did not produce enough distinct new suggestions. Please try again.",
          );
        }

        let persisted: Awaited<ReturnType<typeof aiRepository.persistGeneration>>;
        try {
          persisted = await aiRepository.persistGeneration({
            aiLogId: execution.id,
            providerConfigId: result.providerConfigId,
            projectId,
            triggeredByUserId: actor.id,
            provider: result.provider,
            model: result.model,
            responseContent: {
              suggestions: generated.map((suggestion) => ({
                content: suggestion.content,
                title: suggestion.title,
              })),
            },
            suggestions: generated,
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new AppError("INTERNAL", "The suggestions could not be saved.", {
              cause: error,
            });
          }
          throw error;
        }

        // Suggestions are committed. Refresh only their cache resource; a Redis
        // failure is logged and must not change the successful generation result.
        await refreshSuggestionCacheAfterGeneration(projectId);

        await finishAiExecutionSuccess(execution, {
          provider: result.provider,
          providerConfigId: result.providerConfigId,
          providerName: result.providerName,
          model: result.model,
          metadata: { suggestionCount: generated.length, remainingCapacity },
        });

        return {
          // data: {
          //   responseId: persisted.responseId,
          //   suggestions: persisted.suggestions,
          //   provider: result.provider,
          //   providerName: result.providerName,
          //   model: result.model,
          // },
          data: persisted.suggestions
        };
      } catch (error) {
        await finishAiExecutionFailure(execution, error);
        throw error;
      }
    } catch (error) {
      return toServiceError(error);
    }

  },

  async deleteSuggestion(actor: ServerUser, suggestionId: string): Promise<{ ok: true } | ServiceError> {
    try {
      authorize(actor, "AI_SUGGESTION_DELETE");
      const { suggestionId: validatedSuggestionId } =
        deleteAiSuggestionSchema.parse({ suggestionId });

      const deleted = await aiRepository.deleteSuggestion(validatedSuggestionId);
      const projectId = extractProjectIdFromDeleteResult(deleted);

      if (projectId) {
        await invalidateSuggestionAndListCaches(projectId);
      } else {
        console.warn(
          "[AI] Suggestion was deleted, but the repository result did not include projectId. The suggestions cache could not be invalidated.",
        );
      }
      return { ok: true };
    } catch (error) {
      return toServiceError(error);
    }

  },

  async extractProjectFromFile(actor: ServerUser, file: File, traceId: string,): Promise<{data:ExtractedProject}|ServiceError> {
    
    try {
      
    if (actor.role !== "ADMIN" && actor.role !== "SUPERVISOR" && actor.role !== "STUDENT") {
      throw new AppError("FORBIDDEN");
    }

    const execution = await startAiExecution({
      traceId,
      operation: "project_extraction",
      triggeredByUserId: actor.id,
      projectId: null,
    });
    try {

      const settings = await aiRepository.getSettings();
      if (!settings.enabled) {
        throw new AppError("AI_DISABLED", "AI features are disabled by an administrator.");
      }

      const documentText = await parseFileToText(file);
      if (!documentText.trim()) {
        throw new AppError("VALIDATION", "The uploaded document contains no readable text.");
      }

      await recordAiExecutionEvent(execution, {
        level: "info",
        event: "document_text_extracted",
        message: "Document text extraction completed.",
        details: { fileSizeBytes: file.size, inputCharacters: documentText.length },
      });

      const result = await runWithOrderedProviders<ExtractedProject>(execution, {
        invoke: (provider, context) =>
          provider.extractProjectData(documentText, context),
        validate: validateExtractionPayload,
      });

      await finishAiExecutionSuccess(execution, {
        provider: result.provider,
        providerConfigId: result.providerConfigId,
        providerName: result.providerName,
        model: result.model,
        metadata: {
          operation: "project_extraction",
          inputCharacters: documentText.length,
        },
      });
      return {data:result.payload};
    } catch (error) {
      await finishAiExecutionFailure(execution, error);
      throw error;
    }

  } catch (error) {
    return {error:toSafeMessage(error)}
  }
  },
};

export const normalizeAiSuggestion = normalizeSuggestion;
