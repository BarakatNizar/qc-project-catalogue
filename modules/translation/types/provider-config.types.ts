import type { TranslationProviderName } from "./translation.types";

export type TranslationProviderType = TranslationProviderName;

/** Safe shape returned to admin clients. Never includes the API key or ciphertext. */
export interface TranslationProviderAdminDto {
  id: string;
  name: string;
  providerType: TranslationProviderType;
  baseUrl: string;
  hasApiKey: boolean;
  region: string | null;
  model: string | null;
  timeoutMs: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Server-only configuration passed to a provider adapter. */
export interface RuntimeTranslationProviderConfig {
  id: string;
  name: string;
  providerType: TranslationProviderType;
  baseUrl: string;
  apiKey: string | null;
  region: string | null;
  model: string | null;
  timeoutMs: number;
  enabled: boolean;
  sortOrder: number;
  configurationError?: string;
}

export interface CreateTranslationProviderInput {
  name: string;
  providerType: TranslationProviderType;
  baseUrl: string;
  apiKey?: string | null;
  region?: string | null;
  model?: string | null;
  timeoutMs?: number;
  enabled?: boolean;
  sortOrder?: number;
}

export interface UpdateTranslationProviderInput {
  id: string;
  name?: string;
  baseUrl?: string;
  /** Omit to keep the existing key; pass a non-empty string to replace it. */
  apiKey?: string;
  /** Explicitly removes the stored key. */
  clearApiKey?: boolean;
  region?: string | null;
  model?: string | null;
  timeoutMs?: number;
  enabled?: boolean;
  sortOrder?: number;
}

export interface TranslationProviderOrderInput {
  id: string;
  sortOrder: number;
}
