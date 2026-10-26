import type { AiProvider as DbAiProvider } from "@prisma/client";
import type { AiRequestContext } from "@/infrastructure/ai/ai-observability";

export type AiProviderName = "OPENROUTER" | "LOCAL";

export type AiProviderIdentity = {
  id: string;
  name: string;
  sortOrder: number;
};

export type AiGenerationInput = {
  project: {
    title: string;
    summary: string;
    description: string;
    problemStatement: string | null;
    proposedSolution: string | null;
    objectives: string | null;
    projectType: string;
    projectSupervisorName: string;
    features: { content: string; scope: string }[];
    technologies: { name: string }[];
    existingSuggestions: { content: string; title: string }[];
  };
};

export type AiProviderResult<T = unknown> = {
  payload: T;
  provider: DbAiProvider;
  providerConfigId: string;
  providerName: string;
  model: string;
  providerRequestId?: string;
  outputCharacters?: number;
};

export interface AiProvider {
  readonly providerConfigId: string;
  readonly providerType: AiProviderName;
  readonly providerName: string;
  readonly providerOrder: number;
  readonly modelName: string;

  generateSuggestions(input: AiGenerationInput, context: AiRequestContext): Promise<AiProviderResult>;
  extractProjectData(documentText: string, context: AiRequestContext): Promise<AiProviderResult>;
}
