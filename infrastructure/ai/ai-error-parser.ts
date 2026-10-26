import "server-only";

import axios from "axios";
import { AiProviderError, type AiFailureDetails } from "@/infrastructure/ai/ai-observability";

export type AiErrorMetadata = {
  code: string;
  failureStage: AiFailureDetails["stage"];
  failureKind: AiFailureDetails["kind"];
  retryable: boolean;
  httpStatus?: number;
  providerCode?: string;
  errorName: string;
  explanation: string;
  userMessage: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function findAiProviderError(error: unknown, depth = 0, visited = new Set<unknown>()): AiProviderError | undefined {
  if (depth > 8 || error == null || visited.has(error)) return undefined;
  visited.add(error);
  if (error instanceof AiProviderError) return error;

  if (error instanceof AggregateError) {
    const errors = [...error.errors];
    for (let i = errors.length - 1; i >= 0; i -= 1) {
      const found = findAiProviderError(errors[i], depth + 1, visited);
      if (found) return found;
    }
  }
  if (error instanceof Error && "cause" in error) {
    return findAiProviderError(error.cause, depth + 1, visited);
  }
  return undefined;
}


function findAxiosError(error: unknown, depth = 0, visited = new Set<unknown>()): unknown {
  if (depth > 8 || error == null || visited.has(error)) return undefined;
  visited.add(error);
  if (axios.isAxiosError(error)) return error;
  if (error instanceof AggregateError) {
    const errors = [...error.errors];
    for (let i = errors.length - 1; i >= 0; i -= 1) {
      const found = findAxiosError(errors[i], depth + 1, visited);
      if (found !== undefined) return found;
    }
  }
  if (error instanceof Error && "cause" in error) return findAxiosError(error.cause, depth + 1, visited);
  return undefined;
}

function mapDiagnostics(details: AiFailureDetails, errorName: string): AiErrorMetadata {
  if (details.httpStatus === 401 || details.httpStatus === 403 || details.kind === "authentication") {
    return {
      code: "AI_PROVIDER_AUTH_FAILED", failureStage: details.stage, failureKind: "authentication",
      retryable: false, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
      explanation: "The provider rejected the configured credentials.",
      userMessage: "The AI provider authentication failed. Check its API key and permissions.",
    };
  }
  if (details.httpStatus === 429 || details.kind === "rate_limit") {
    return {
      code: "AI_PROVIDER_RATE_LIMITED", failureStage: details.stage, failureKind: "rate_limit",
      retryable: true, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
      explanation: "The provider rate limit or quota was reached.",
      userMessage: "The AI provider is temporarily rate-limited. Another configured provider may be used.",
    };
  }
  if (details.kind === "timeout") {
    return {
      code: "AI_PROVIDER_TIMEOUT", failureStage: details.stage, failureKind: details.kind,
      retryable: true, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
      explanation: "The provider request exceeded its configured timeout.",
      userMessage: "The AI provider timed out. Another configured provider may be used.",
    };
  }
  if (details.kind === "network") {
    return {
      code: "AI_PROVIDER_NETWORK_ERROR", failureStage: details.stage, failureKind: details.kind,
      retryable: true, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
      explanation: "The application could not connect to the provider.",
      userMessage: "The AI provider could not be reached. Check its URL and network availability.",
    };
  }
  if (details.httpStatus !== undefined && details.httpStatus >= 500) {
    return {
      code: "AI_PROVIDER_SERVER_ERROR", failureStage: details.stage, failureKind: "http",
      retryable: true, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
      explanation: "The provider returned a server-side HTTP error.",
      userMessage: "The AI provider is experiencing a server error. Another configured provider may be used.",
    };
  }
  if (details.httpStatus !== undefined) {
    return {
      code: "AI_PROVIDER_HTTP_ERROR", failureStage: details.stage, failureKind: "http",
      retryable: details.retryable, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
      explanation: `The provider rejected or could not process the request (HTTP ${details.httpStatus}).`,
      userMessage: "The AI provider rejected the request. Check the provider URL, model, and request compatibility.",
    };
  }
  if (details.stage === "json_parse" || details.kind === "malformed_json") {
    return {
      code: "AI_PROVIDER_MALFORMED_JSON", failureStage: details.stage, failureKind: details.kind,
      retryable: true, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
      explanation: "The provider response was not valid JSON.",
      userMessage: "The AI provider returned an invalid response. Please retry or contact an administrator.",
    };
  }
  if (details.stage === "schema_validation" || details.kind === "schema_validation") {
    return {
      code: "AI_OUTPUT_SCHEMA_INVALID", failureStage: details.stage, failureKind: "schema_validation",
      retryable: true, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
      explanation: "The generated output did not satisfy QC's required schema.",
      userMessage: "The AI provider returned an unsupported response. Another provider may be tried.",
    };
  }
  if (details.kind === "truncated") {
    return {
      code: "AI_PROVIDER_OUTPUT_TRUNCATED", failureStage: details.stage, failureKind: details.kind,
      retryable: true, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
      explanation: "The model output was cut off before a complete response was returned.",
      userMessage: "The AI response was incomplete. Please retry or use another configured provider.",
    };
  }
  return {
    code: "AI_PROVIDER_INVALID_RESPONSE", failureStage: details.stage, failureKind: details.kind,
    retryable: details.retryable, httpStatus: details.httpStatus, providerCode: details.providerCode, errorName,
    explanation: "The provider returned a response QC could not process.",
    userMessage: "The AI provider returned an unexpected response.",
  };
}

function getApplicationCode(error: unknown): string | undefined {
  if (!isRecord(error)) return undefined;
  const code = error.code;
  return typeof code === "string" && /^[A-Z0-9_]{2,80}$/.test(code) ? code : undefined;
}

/** One classifier for provider, service, validation, persistence, and nested fallback errors. */
export function parseAiError(error: unknown): AiErrorMetadata {
  const providerError = findAiProviderError(error);
  if (providerError) return mapDiagnostics(providerError.diagnostics, providerError.name);

  const axiosError = axios.isAxiosError(error) ? error : findAxiosError(error);
  if (axiosError && axios.isAxiosError(axiosError)) {
    const status = axiosError.response?.status;
    const code = typeof axiosError.code === "string" ? axiosError.code : undefined;
    let details: AiFailureDetails;
    if (code === "ETIMEDOUT" || code === "ECONNABORTED") {
      details = { stage: "transport", kind: "timeout", retryable: true, providerCode: code };
    } else if (status !== undefined) {
      details = {
        stage: "transport",
        kind: status === 429 ? "rate_limit" : status === 401 || status === 403 ? "authentication" : "http",
        retryable: status === 408 || status === 409 || status === 425 || status === 429 || status >= 500,
        httpStatus: status,
        providerCode: code ?? `HTTP_${status}`,
      };
    } else {
      details = { stage: "transport", kind: "network", retryable: true, providerCode: code };
    }
    return mapDiagnostics(details, "AxiosError");
  }

  const applicationCode = getApplicationCode(error);
  if (applicationCode === "AI_DISABLED") {
    return {
      code: applicationCode, failureStage: "service", failureKind: "unexpected", retryable: false,
      errorName: error instanceof Error ? error.name : "NonErrorThrown",
      explanation: "An administrator disabled the AI service.", userMessage: "AI features are currently disabled.",
    };
  }
  if (applicationCode === "VALIDATION") {
    return {
      code: applicationCode, failureStage: "service", failureKind: "schema_validation", retryable: false,
      errorName: error instanceof Error ? error.name : "NonErrorThrown",
      explanation: "The request or uploaded content failed validation.", userMessage: "The supplied input is invalid.",
    };
  }
  if (applicationCode === "INTERNAL" || applicationCode === "PERSISTENCE") {
    return {
      code: "AI_PERSISTENCE_FAILED", failureStage: "persistence", failureKind: "unexpected", retryable: false,
      errorName: error instanceof Error ? error.name : "NonErrorThrown",
      explanation: "QC could not persist the result.", userMessage: "The AI result could not be saved.",
    };
  }
  if (applicationCode === "AI_UNAVAILABLE") {
    return {
      code: applicationCode, failureStage: "configuration", failureKind: "unexpected", retryable: false,
      errorName: error instanceof Error ? error.name : "NonErrorThrown",
      explanation: "No configured provider completed the requested operation.",
      userMessage: "The AI service is temporarily unavailable. Try again later.",
    };
  }
  if ((applicationCode && /^P\d{4}$/.test(applicationCode)) ||
      (error instanceof Error && error.name.startsWith("PrismaClient"))) {
    return {
      code: "AI_PERSISTENCE_FAILED", failureStage: "persistence", failureKind: "unexpected", retryable: false,
      errorName: error instanceof Error ? error.name : "PrismaError",
      explanation: "A database operation required by the AI workflow failed.",
      userMessage: "The AI request could not be recorded or its result could not be saved.",
    };
  }

  // If a wrapper hid the original provider error in `cause`, inspect the chain for an Axios error too.
  if (error instanceof Error && "cause" in error && error.cause !== error) {
    const nested = parseAiError(error.cause);
    if (nested.code.startsWith("AI_PROVIDER_") || nested.code === "AI_OUTPUT_SCHEMA_INVALID") return nested;
  }

  return {
    code: "AI_UNEXPECTED_ERROR", failureStage: "service", failureKind: "unexpected", retryable: false,
    errorName: error instanceof Error ? error.name : "NonErrorThrown",
    explanation: "An unexpected error occurred during the AI operation.",
    userMessage: "The AI operation failed unexpectedly. Contact an administrator if it continues.",
  };
}
