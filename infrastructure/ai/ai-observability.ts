import "server-only";

export type AiOperation = "suggestions" | "project_extraction";
export type AiLogLevel = "info" | "warn" | "error";

export type AiDiagnosticEvent = {
  level: AiLogLevel;
  event: string;
  message?: string;
  details?: Record<string, unknown>;
};

export type AiRequestContext = {
  traceId: string;
  attempt: number;
  recordEvent?: (event: AiDiagnosticEvent) => Promise<void>;
};

export type AiFailureDetails = {
  stage:
    | "configuration"
    | "transport"
    | "response_shape"
    | "content_extraction"
    | "json_parse"
    | "schema_validation"
    | "persistence"
    | "document_parsing"
    | "service";
  kind:
    | "timeout"
    | "network"
    | "http"
    | "invalid_response"
    | "truncated"
    | "malformed_json"
    | "schema_validation"
    | "authentication"
    | "rate_limit"
    | "unexpected";
  retryable: boolean;
  httpStatus?: number;
  providerCode?: string;
};

export type AiLogConsoleEvent = {
  traceId: string;
  operation: AiOperation;
  event: string;
  provider?: string;
  providerConfigId?: string;
  providerName?: string;
  model?: string;
  attempt?: number;
  durationMs?: number;
  providerRequestId?: string;
  failureStage?: AiFailureDetails["stage"];
  failureKind?: AiFailureDetails["kind"];
  retryable?: boolean;
  httpStatus?: number;
  providerCode?: string;
  errorName?: string;
  issueCount?: number;
  outputCharacters?: number;
};

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly diagnostics: AiFailureDetails,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "AiProviderError";
  }
}

export function logAiEvent(level: AiLogLevel, event: AiLogConsoleEvent): void {
  // This is operational console output. Persistent execution details are stored in one AiLog row.
  const line = JSON.stringify({ timestamp: new Date().toISOString(), subsystem: "ai", ...event });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
