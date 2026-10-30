import "server-only";

import { AppError } from "@/core/errors/app-error";
import { AiProviderError } from "@/infrastructure/ai/ai-observability";
import { parseAiError } from "@/infrastructure/ai/ai-error-parser";
import type { AiProvider, AiProviderResult } from "@/infrastructure/ai/ai-provider";
import {
  createAiRequestContext,
  finishAiProviderAttemptFailure,
  finishAiProviderAttemptSuccess,
  recordAiExecutionEvent,
  startAiProviderAttempt,
  type AiExecutionHandle,
} from "@/modules/ai/services/ai-execution-recorder";
import { resolveConfiguredAiProviders } from "@/modules/ai/services/ai-provider-resolver";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issueCount: number; issues?:any };

type RunWithProvidersOptions<T> = {
  invoke: (provider: AiProvider, context: ReturnType<typeof createAiRequestContext>) => Promise<AiProviderResult>;
  validate: (payload: unknown) => ValidationResult<T>;
};

/** Tries up to four enabled providers in the configured order. No MAIN/FALLBACK modes exist. */
export async function runWithOrderedProviders<T>(
  execution: AiExecutionHandle,
  options: RunWithProvidersOptions<T>,
): Promise<Omit<AiProviderResult, "payload"> & { payload: T }> {
  const providers = await resolveConfiguredAiProviders(execution);
  if (providers.length === 0) {
    await recordAiExecutionEvent(execution, {
      level: "error",
      event: "no_usable_provider_configured",
      message: "No enabled, usable AI provider is configured.",
    });
    throw new AppError("AI_UNAVAILABLE", "No enabled AI provider is configured.");
  }
  if (providers.length > 4) {
    await recordAiExecutionEvent(execution, {
      level: "error",
      event: "provider_limit_exceeded",
      message: "More than four enabled AI providers were returned by configuration.",
    });
    throw new AppError("INTERNAL", "AI provider configuration is invalid.");
  }

  const failures: unknown[] = [];

  for (const [index, provider] of providers.entries()) {
    const attempt = await startAiProviderAttempt({ execution, attempt: index + 1, provider });
    try {
      const result = await options.invoke(provider, createAiRequestContext(execution, attempt));
      const parsed = options.validate(result.payload);
      if (!parsed.success) {
        await recordAiExecutionEvent(execution, {
          level: "error",
          event: "output_schema_validation_failed",
          message: "The provider response did not satisfy QC's expected output schema.",
          details: {
            attempt: attempt.attempt,
            issueCount: parsed.issueCount,
            issues:parsed?.issues,
            providerConfigId: provider.providerConfigId,
            provider: provider.providerType,
            providerName: provider.providerName,
            model: provider.modelName,
            failureStage: "schema_validation",
            failureKind: "schema_validation",
          },
        }, attempt.id);
        throw new AiProviderError(
          "AI provider output failed schema validation.",
          { stage: "schema_validation", kind: "schema_validation", retryable: true },
        );
      }

      await finishAiProviderAttemptSuccess(execution, attempt, {
        providerRequestId: result.providerRequestId,
        outputCharacters: result.outputCharacters,
      });
      await recordAiExecutionEvent(execution, {
        level: "info",
        event: "provider_selected",
        message: "A provider returned a valid response.",
        details: {
          providerConfigId: result.providerConfigId,
          provider: result.provider,
          providerName: result.providerName,
          model: result.model,
          attempt: attempt.attempt,
        },
      });
      return { ...result, payload: parsed.data };
    } catch (error) {
      failures.push(error);
      await finishAiProviderAttemptFailure(execution, attempt, error);
      const metadata = parseAiError(error);
      await recordAiExecutionEvent(execution, {
        level: "warn",
        event: "provider_failed_try_next",
        message: metadata.explanation,
        details: {
          providerConfigId: provider.providerConfigId,
          provider: provider.providerType,
          providerName: provider.providerName,
          model: provider.modelName,
          attempt: attempt.attempt,
          failureStage: metadata.failureStage,
          failureKind: metadata.failureKind,
          retryable: metadata.retryable,
          httpStatus: metadata.httpStatus ?? 0,
          providerCode: metadata.providerCode ?? "",
          errorName: metadata.errorName,
          errorCode: metadata.code,
        },
      }, attempt.id);
    }
  }

  const lastFailure = failures[failures.length - 1];
  const causes = failures.filter((error): error is Error => error instanceof Error);
  const lastMetadata = parseAiError(lastFailure);
  throw new AppError("AI_UNAVAILABLE", lastMetadata.userMessage, {
    cause: new AggregateError(causes, "All configured AI provider attempts failed."),
  });
}
