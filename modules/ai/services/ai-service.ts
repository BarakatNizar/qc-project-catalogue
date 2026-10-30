import "server-only";

import type { ServerUser } from "@/core/auth/session";
import { authorize } from "@/core/authorization/authorization-layer";
import { AppError } from "@/core/errors/app-error";
import {
  aiSuggestionResponseSchema,
  requestAiSuggestionsSchema,
  deleteAiSuggestionSchema,
  type AiSuggestionResponsePayload,
} from "@/shared/validation/ai";
import { extractedProjectResponseSchema } from "@/shared/validation/project-extraction";
import { projectRepository } from "@/modules/project/repositories/project-repository";
import { aiRepository } from "@/modules/ai/repositories/ai-repository";
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
import type { ExtractedProject } from "@/modules/project/types";
import { Prisma } from "@prisma/client";

const MAX_SUGGESTIONS_PER_PROJECT = 10;
const MIN_SUGGESTIONS_PER_GENERATION = 3;
const MAX_SUGGESTIONS_PER_GENERATION = 4;
const MAX_EXTRACTION_FILE_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_CHARACTERS = 150_000;

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issueCount: number ; issues?:any};

function makeInput(project: NonNullable<Awaited<ReturnType<typeof projectRepository.findAiContextById>>>) {
  return {
    project: {
      title: project.title,
      summary: project.summary,
      description: project.description,
      problemStatement: project.problemStatement,
      proposedSolution: project.proposedSolution,
      targetUsers:project.targetUsers,
      availableResources:project.availableResources,
      constraints:project.constraints,
      objectives: project.objectives,
      projectType: project.projectType,
      projectSupervisorName: project.projectSupervisorName,
      features: project.features.map((feature) => ({ content: feature.content, scope: feature.scope })),
      technologies: project.technologies.map((technology) => ({ name: technology.name })),
      existingSuggestions: project.suggestions.map((suggestion) => ({
        content: suggestion.content,
        title: suggestion.title,
      })),
    },
  };
}

function validateSuggestionPayload(payload: unknown): ValidationResult<AiSuggestionResponsePayload> {
  const parsed = aiSuggestionResponseSchema.safeParse(payload);
  return parsed.success ? { success: true, data: parsed.data } : { success: false, issueCount: parsed.error.issues.length };
}

function validateExtractionPayload(payload: unknown): ValidationResult<ExtractedProject> {
  console.log(payload);
  const parsed = extractedProjectResponseSchema.safeParse(payload);
  return parsed.success ? { success: true, data: parsed.data } : { success: false, issueCount: parsed.error.issues.length , issues: parsed.error.issues.map((issue) => ({
    path: issue.path,
    code: issue.code,
    message: issue.message,
    expected: "expected" in issue ? issue.expected : undefined,
    received: "received" in issue ? issue.received : undefined,
  }))
};
}

async function parseFileToText(file: File): Promise<string> {
  if (file.size <= 0) throw new AppError("VALIDATION", "The uploaded file is empty.");
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
      throw new AppError("VALIDATION", "Failed to parse the PDF file. Ensure it is not password-protected or corrupted.");
    }
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    try {
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value;
    } catch {
      throw new AppError("VALIDATION", "Failed to parse the Word document.");
    }
  } else {
    throw new AppError("VALIDATION", "Unsupported file format. Please upload PDF, Word (.docx), or Text (.txt).");
  }

  if (text.length > MAX_EXTRACTED_TEXT_CHARACTERS) {
    throw new AppError("VALIDATION", "The extracted text exceeds the supported length. Reduce the document size and try again.");
  }
  return text;
}

export const aiService = {
  async getSettings(actor: ServerUser) {
    if (actor.role !== "ADMIN" && actor.role !== "SUPERVISOR") throw new AppError("FORBIDDEN");
    const settings = await aiRepository.getSettings();
    return { enabled: settings.enabled, updatedAt: settings.updatedAt };
  },

  async getPublicSettings() {
    const settings = await aiRepository.getSettings();
    return { enabled: settings.enabled };
  },

  async setEnabled(actor: ServerUser, enabled: boolean) {
    authorize(actor, "AI_SETTINGS_MANAGE");
    return aiRepository.setEnabled(enabled);
  },

  async listSuggestions(actor: ServerUser, projectId: string) {
    if (actor.role !== "STUDENT" && actor.role !== "SUPERVISOR") throw new AppError("FORBIDDEN");
    const { projectId: validatedProjectId } = requestAiSuggestionsSchema.parse({ projectId });
    const project = await projectRepository.findById(validatedProjectId);
    if (!project || (actor.role === "STUDENT" && project.visibility !== "VISIBLE")) throw new AppError("NOT_FOUND");
    return aiRepository.listSuggestions(validatedProjectId);
  },

  async requestSuggestions(actor: ServerUser, raw: unknown, traceId: string) {
    authorize(actor, "AI_SUGGESTION_REQUEST");
    const { projectId } = requestAiSuggestionsSchema.parse(raw);
    const [settings, project] = await Promise.all([
      aiRepository.getSettings(),
      projectRepository.findAiContextById(projectId),
    ]);

    if (!project || project.visibility !== "VISIBLE") throw new AppError("NOT_FOUND");
    if (!settings.enabled) throw new AppError("AI_DISABLED", "AI suggestion generation is disabled by an administrator.");
    if (!project.title.trim() || !project.description.trim()) {
      throw new AppError("VALIDATION", "The project brief needs a title and description before AI suggestions can be generated.");
    }

    const remainingCapacity = MAX_SUGGESTIONS_PER_PROJECT - project.suggestions.length;
    if (remainingCapacity < MIN_SUGGESTIONS_PER_GENERATION) {
      throw new AppError("AI_UNAVAILABLE", "There is not enough remaining capacity to generate at least three new suggestions.");
    }

    const execution = await startAiExecution({
      traceId,
      operation: "suggestions",
      triggeredByUserId: actor.id,
      projectId,
    });

    try {
      const input = makeInput(project);
      const result = await runWithOrderedProviders<AiSuggestionResponsePayload>(execution, {
        invoke: (provider, context) => provider.generateSuggestions(input, context),
        validate: validateSuggestionPayload,
      });

      const generated = removeExactDuplicates(project.suggestions, result.payload.suggestions)
        .slice(0, Math.min(MAX_SUGGESTIONS_PER_GENERATION, remainingCapacity));

      if (generated.length < MIN_SUGGESTIONS_PER_GENERATION) {
        await recordAiExecutionEvent(execution, {
          level: "error",
          event: "suggestion_postprocessing_failed",
          message: "Too few distinct new suggestions remained after duplicate removal.",
          details: { suggestionCount: generated.length, remainingCapacity },
        });
        throw new AppError("AI_UNAVAILABLE", "The model did not produce enough distinct new suggestions. Please try again.");
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
            suggestions: generated.map((suggestion) => ({ content: suggestion.content, title: suggestion.title })),
          },
          suggestions: generated,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new AppError("INTERNAL", "The suggestions could not be saved.", { cause: error });
        }
        throw error;
      }

      await finishAiExecutionSuccess(execution, {
        provider: result.provider,
        providerConfigId: result.providerConfigId,
        providerName: result.providerName,
        model: result.model,
        metadata: { suggestionCount: generated.length, remainingCapacity },
      });

      return {
        data: {
          responseId: persisted.responseId,
          suggestions: persisted.suggestions,
          provider: result.provider,
          providerName: result.providerName,
          model: result.model,
        },
      };
    } catch (error) {
      await finishAiExecutionFailure(execution, error);
      throw error;
    }
  },

  async deleteSuggestion(actor: ServerUser, suggestionId: string) {
    authorize(actor, "AI_SUGGESTION_DELETE");
    const { suggestionId: validatedSuggestionId } = deleteAiSuggestionSchema.parse({ suggestionId });
    try {
      return await aiRepository.deleteSuggestion(validatedSuggestionId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError("NOT_FOUND");
      }
      throw error;
    }
  },

  async extractProjectFromFile(actor: ServerUser, file: File, traceId: string): Promise<ExtractedProject> {
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
      if (!settings.enabled) throw new AppError("AI_DISABLED", "AI features are disabled by an administrator.");

      const documentText = await parseFileToText(file);
      if (!documentText.trim()) throw new AppError("VALIDATION", "The uploaded document contains no readable text.");

      await recordAiExecutionEvent(execution, {
        level: "info",
        event: "document_text_extracted",
        message: "Document text extraction completed.",
        details: { fileSizeBytes: file.size, inputCharacters: documentText.length },
      });

      const result = await runWithOrderedProviders<ExtractedProject>(execution, {
        invoke: (provider, context) => provider.extractProjectData(documentText, context),
        validate: validateExtractionPayload,
      });

      await finishAiExecutionSuccess(execution, {
        provider: result.provider,
        providerConfigId: result.providerConfigId,
        providerName: result.providerName,
        model: result.model,
        metadata: { operation: "project_extraction", inputCharacters: documentText.length },
      });
      return result.payload;
    } catch (error) {
      await finishAiExecutionFailure(execution, error);
      throw error;
    }
  },
};

export const normalizeAiSuggestion = normalizeSuggestion;
