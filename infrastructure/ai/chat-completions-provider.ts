import "server-only";

import axios from "axios";
import type { AiProvider, AiProviderName, AiProviderIdentity, AiGenerationInput, AiProviderResult } from "@/infrastructure/ai/ai-provider";
import { AiProviderError, type AiFailureDetails, type AiRequestContext } from "@/infrastructure/ai/ai-observability";
import { parseAiError } from "@/infrastructure/ai/ai-error-parser";
import { DOCUMENT_EXTRACTION_SYSTEM_PROMPT, SYSTEM_PROMPT } from "@/infrastructure/ai/prompts";

export type ProviderConfig = {
  provider: AiProviderName;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
};

type ChatMessage = { role: "system" | "user"; content: string };
type RequestJsonOptions = {
  operation: "suggestions" | "project_extraction";
  context: AiRequestContext;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};
type JsonResult = { payload: unknown; providerRequestId?: string; outputCharacters: number };
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequestId(headers: unknown): string | undefined {
  if (!isRecord(headers)) return undefined;
  const value = headers["x-request-id"] ?? headers["request-id"] ?? headers["x-openrouter-request-id"];
  return typeof value === "string" ? value.slice(0, 180) : undefined;
}

function extractContent(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.choices) || body.choices.length === 0) {
    throw new AiProviderError("Invalid provider response structure.", {
      stage: "response_shape", kind: "invalid_response", retryable: false,
    });
  }

  const first = body.choices[0];
  if (!isRecord(first)) {
    throw new AiProviderError("Provider returned an invalid choice.", {
      stage: "response_shape", kind: "invalid_response", retryable: false,
    });
  }
  if (first.finish_reason === "length") {
    throw new AiProviderError("Provider output was truncated by the token limit.", {
      stage: "content_extraction", kind: "truncated", retryable: true,
    });
  }

  const message = first.message;
  if (!isRecord(message)) {
    throw new AiProviderError("Provider returned no message.", {
      stage: "response_shape", kind: "invalid_response", retryable: false,
    });
  }

  const content = message.content;
  let text: string;
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    text = content.flatMap((part) => isRecord(part) && typeof part.text === "string" ? [part.text] : []).join("\n");
  } else {
    throw new AiProviderError("Provider returned non-text content.", {
      stage: "content_extraction", kind: "invalid_response", retryable: false,
    });
  }

  text = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (!text) {
    throw new AiProviderError("Provider returned empty content.", {
      stage: "content_extraction", kind: "invalid_response", retryable: false,
    });
  }
  return text;
}

function transportDetails(error: unknown): AiFailureDetails {
  const metadata = parseAiError(error);
  return {
    stage: metadata.failureStage,
    kind: metadata.failureKind,
    retryable: metadata.retryable,
    ...(metadata.httpStatus !== undefined ? { httpStatus: metadata.httpStatus } : {}),
    ...(metadata.providerCode ? { providerCode: metadata.providerCode } : {}),
  };
}

export class ChatCompletionsProvider implements AiProvider {
  readonly providerConfigId: string;
  readonly providerType: AiProviderName;
  readonly providerName: string;
  readonly providerOrder: number;
  readonly modelName: string;

  constructor(
    private readonly config: ProviderConfig,
    identity: AiProviderIdentity,
  ) {
    this.providerConfigId = identity.id;
    this.providerType = config.provider;
    this.providerName = identity.name;
    this.providerOrder = identity.sortOrder;
    this.modelName = config.model;
  }

  private async requestJson(options: RequestJsonOptions): Promise<JsonResult> {
    const startedAt = Date.now();
    const baseUrl = this.config.baseUrl.replace(/\/+$/, "");
    let providerRequestId: string | undefined;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.config.apiKey) headers.Authorization = `Bearer ${this.config.apiKey}`;
      if (this.config.provider === "OPENROUTER") {
        headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        headers["X-Title"] = "Qalamoon Compass";
      }

      await options.context.recordEvent?.({
        level: "info",
        event: "provider_request_started",
        message: "A request was sent to the configured provider.",
        details: {
          provider: this.providerType,
          providerConfigId: this.providerConfigId,
          providerName: this.providerName,
          model: this.modelName,
          attempt: options.context.attempt,
          timeoutMs: this.config.timeoutMs,
        },
      });

      const response = await axios.post<unknown>(`${baseUrl}/chat/completions`, {
        model: this.config.model,
        response_format: { type: "json_object" },
        messages: options.messages,
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
        ...(options.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
      }, {
        headers,
        timeout: this.config.timeoutMs,
        transitional: { clarifyTimeoutError: true },
      });

      providerRequestId = readRequestId(response.headers);
      const content = extractContent(response.data);
      let payload: unknown;
      try {
        payload = JSON.parse(content);
      } catch (error) {
        throw new AiProviderError("Provider returned malformed JSON.", {
          stage: "json_parse", kind: "malformed_json", retryable: true,
        }, error);
      }

      await options.context.recordEvent?.({
        level: "info",
        event: "provider_response_parsed",
        message: "Provider response content was parsed as JSON.",
        details: {
          provider: this.providerType,
          providerConfigId: this.providerConfigId,
          providerName: this.providerName,
          model: this.modelName,
          attempt: options.context.attempt,
          durationMs: Date.now() - startedAt,
          providerRequestId: providerRequestId ?? "",
          outputCharacters: content.length,
        },
      });

      return { payload, providerRequestId, outputCharacters: content.length };
    } catch (error) {
      const metadata = parseAiError(error);
      const normalized = error instanceof AiProviderError
        ? error
        : new AiProviderError("AI provider request failed.", transportDetails(error), error);

      await options.context.recordEvent?.({
        level: "error",
        event: "provider_request_failed",
        message: metadata.explanation,
        details: {
          provider: this.providerType,
          providerConfigId: this.providerConfigId,
          providerName: this.providerName,
          model: this.modelName,
          attempt: options.context.attempt,
          durationMs: Date.now() - startedAt,
          providerRequestId: providerRequestId ?? "",
          failureStage: metadata.failureStage,
          failureKind: metadata.failureKind,
          retryable: metadata.retryable,
          httpStatus: metadata.httpStatus ?? 0,
          providerCode: metadata.providerCode ?? "",
          errorName: metadata.errorName,
          errorCode: metadata.code,
        },
      });
      throw normalized;
    }
  }

  async generateSuggestions(input: AiGenerationInput, context: AiRequestContext): Promise<AiProviderResult> {
    const result = await this.requestJson({
      operation: "suggestions",
      context,
      maxTokens: 10000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(input) },
      ],
    });
    return {
      ...result,
      provider: this.providerType,
      providerConfigId: this.providerConfigId,
      providerName: this.providerName,
      model: this.modelName,
    };
  }

  async extractProjectData(documentText: string, context: AiRequestContext): Promise<AiProviderResult> {
    const result = await this.requestJson({
      operation: "project_extraction",
      context,
      temperature: 0.2,
      maxTokens: 50000,
      messages: [
        { role: "system", content: DOCUMENT_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: documentText },
      ],
    });
    return {
      ...result,
      provider: this.providerType,
      providerConfigId: this.providerConfigId,
      providerName: this.providerName,
      model: this.modelName,
    };
  }
}
