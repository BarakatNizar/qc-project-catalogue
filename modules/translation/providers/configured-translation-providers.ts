import "server-only";

import { TranslationServiceClient } from "@google-cloud/translate";

import type {
  TranslationLanguage,
  TranslationProviderName,
  TranslationProviderOutput,
  TranslationResult,
} from "@/modules/translation/types/translation.types";
import type { RuntimeTranslationProviderConfig } from "@/modules/translation/types/provider-config.types";
import type { TranslationProviderAdapter } from "./translation-provider.types";

interface TextChunk {
  inputIndex: number;
  chunkIndex: number;
  text: string;
}

type DetectionResult = Array<string | null>;

function normalizeLanguageCode(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().toLowerCase().split(/[-_]/u)[0] || null;
}

function chunksFor(texts: string[], maxCodePoints = 4_000): TextChunk[] {
  const chunks: TextChunk[] = [];
  texts.forEach((text, inputIndex) => {
    const points = Array.from(text);
    let start = 0;
    let chunkIndex = 0;

    while (start < points.length) {
      let end = Math.min(start + maxCodePoints, points.length);
      if (end < points.length) {
        const preferredBoundary = start + Math.floor(maxCodePoints * 0.75);
        for (let cursor = end; cursor > preferredBoundary; cursor -= 1) {
          if (/\s/u.test(points[cursor - 1])) {
            end = cursor;
            break;
          }
        }
      }
      chunks.push({ inputIndex, chunkIndex, text: points.slice(start, end).join("") });
      start = end;
      chunkIndex += 1;
    }
  });
  return chunks;
}

function batches<T extends { text: string }>(items: T[], maxItems: number, maxCodePoints: number): T[][] {
  const output: T[][] = [];
  let current: T[] = [];
  let count = 0;

  for (const item of items) {
    const length = Array.from(item.text).length;
    if (current.length && (current.length >= maxItems || count + length > maxCodePoints)) {
      output.push(current);
      current = [];
      count = 0;
    }
    current.push(item);
    count += length;
  }
  if (current.length) output.push(current);
  return output;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const output = new Array<R>(items.length);
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      output[index] = await mapper(items[index], index);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return output;
}

function mergeDetectedLanguages(
  count: number,
  chunks: TextChunk[],
  values: Array<string | null>,
): DetectionResult {
  const grouped: Array<Set<string>> = Array.from({ length: count }, () => new Set());
  chunks.forEach((chunk, index) => {
    const language = values[index];
    if (language) grouped[chunk.inputIndex].add(language);
  });
  return grouped.map((languages) => {
    const values = [...languages];
    return values.length === 1 ? values[0] : null;
  });
}

function combineResults(
  texts: string[],
  translated: string[][],
  detections: Array<Set<string>>,
): TranslationProviderOutput[] {
  return texts.map((text, index) => {
    const languages = [...detections[index]];
    return {
      translatedText: translated[index].join("") || text,
      detectedSourceLanguage: languages.length === 1 ? languages[0] : null,
    };
  });
}

function timeoutFor(config: RuntimeTranslationProviderConfig): number {
  return Number.isFinite(config.timeoutMs) && config.timeoutMs > 0
    ? config.timeoutMs
    : 45_000;
}

function httpError(provider: string, status: number): string {
  if (status === 401 || status === 403) return `${provider} authentication or permission failed.`;
  if (status === 413) return `${provider} rejected a request that was too large.`;
  if (status === 429) return `${provider} rate limit or quota was exceeded.`;
  if (status === 400 || status === 422) return `${provider} rejected the request. Check its configuration and input.`;
  if (status === 408 || status === 504) return `${provider} request timed out.`;
  if (status >= 500) return `${provider} is temporarily unavailable.`;
  return `${provider} request failed with HTTP ${status}.`;
}

function safeProviderError(provider: string, error: unknown): string {
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return `${provider} request timed out.`;
  }
  if (error instanceof Error && error.message.startsWith(`${provider} `)) {
    return error.message;
  }
  console.error(`[Translation] ${provider} adapter failed`, {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return `${provider} request failed.`;
}

function requireApiKey(config: RuntimeTranslationProviderConfig, provider: string): string {
  if (!config.apiKey) throw new Error(`${provider} API key is not configured.`);
  return config.apiKey;
}

function requireHttpBaseUrl(config: RuntimeTranslationProviderConfig, provider: string): string {
  const value = config.baseUrl.trim().replace(/\/+$/u, "");
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${provider} base URL is invalid.`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${provider} base URL must not embed credentials.`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${provider} base URL must use HTTP or HTTPS.`);
  }
  const allowsHttp = ["Local AI", "LibreTranslate", "Lingva"].includes(provider);
  if (parsed.protocol === "http:" && !allowsHttp) {
    throw new Error(`${provider} requires an HTTPS base URL.`);
  }
  return value;
}

function getGoogleParent(config: RuntimeTranslationProviderConfig): string {
  const value = config.baseUrl.trim().replace(/\/+$/u, "");
  if (value.startsWith("projects/")) return value;
  if (!value) throw new Error("Google Cloud project ID is not configured.");
  const location = config.region?.trim() || "global";
  return `projects/${value}/locations/${location}`;
}

function getGoogleClient(config: RuntimeTranslationProviderConfig): TranslationServiceClient {
  if (!config.apiKey) return new TranslationServiceClient();

  let credentials: unknown;
  try {
    credentials = JSON.parse(config.apiKey);
  } catch {
    throw new Error("Google credentials must be a service-account JSON document.");
  }

  if (typeof credentials !== "object" || credentials === null) {
    throw new Error("Google service-account credentials are invalid.");
  }

  const credentialRecord = credentials as Record<string, unknown>;
  if (typeof credentialRecord.client_email !== "string" || typeof credentialRecord.private_key !== "string") {
    throw new Error("Google service-account credentials are missing client_email or private_key.");
  }

  return new TranslationServiceClient({ credentials: credentials as { client_email: string; private_key: string } });
}

async function googleDetect(
  texts: string[],
  config: RuntimeTranslationProviderConfig,
): Promise<TranslationResult<DetectionResult>> {
  let client: TranslationServiceClient | undefined;
  try {
    client = getGoogleClient(config);
    const parent = getGoogleParent(config);
    const chunks = chunksFor(texts, 1_000);
    const detectedChunks = await mapWithConcurrency(chunks, 8, async (chunk) => {
      const [response] = await client!.detectLanguage(
        { parent, content: chunk.text, mimeType: "text/plain" },
        { timeout: timeoutFor(config) },
      );
      return normalizeLanguageCode(response.languages?.[0]?.languageCode);
    });
    return { data: mergeDetectedLanguages(texts.length, chunks, detectedChunks) };
  } catch (error) {
    return { error: safeProviderError("Google Translation detection", error) };
  } finally {
    if (client) await client.close().catch(() => undefined);
  }
}

async function googleTranslate(
  texts: string[],
  target: TranslationLanguage,
  config: RuntimeTranslationProviderConfig,
): Promise<TranslationResult<TranslationProviderOutput[]>> {
  let client: TranslationServiceClient | undefined;
  try {
    client = getGoogleClient(config);
    const parent = getGoogleParent(config);
    const chunks = chunksFor(texts, 1_000);
    const translated = texts.map(() => [] as string[]);
    const detected = texts.map(() => new Set<string>());

    for (const batch of batches(chunks, 128, 25_000)) {
      const [response] = await client.translateText({
        parent,
        contents: batch.map((chunk) => chunk.text),
        mimeType: "text/plain",
        targetLanguageCode: target,
      }, { timeout: timeoutFor(config) });
      const results = response.translations ?? [];
      if (results.length !== batch.length) return { error: "Google Translation returned an incomplete response." };
      results.forEach((result, index) => {
        const chunk = batch[index];
        translated[chunk.inputIndex][chunk.chunkIndex] = result.translatedText || chunk.text;
        const language = normalizeLanguageCode(result.detectedLanguageCode);
        if (language) detected[chunk.inputIndex].add(language);
      });
    }
    return { data: combineResults(texts, translated, detected) };
  } catch (error) {
    return { error: safeProviderError("Google Translation", error) };
  } finally {
    if (client) await client.close().catch(() => undefined);
  }
}

async function microsoftRequest(
  texts: string[],
  path: "translate" | "detect",
  config: RuntimeTranslationProviderConfig,
  target?: TranslationLanguage,
): Promise<unknown[]> {
  const apiKey = requireApiKey(config, "Microsoft Translator");
  const baseUrl = requireHttpBaseUrl(config, "Microsoft Translator");
  const url = new URL(`${baseUrl}/${path}`);
  url.searchParams.set("api-version", "3.0");
  if (target) url.searchParams.set("to", target);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": apiKey,
  };
  if (config.region) headers["Ocp-Apim-Subscription-Region"] = config.region;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(texts.map((Text) => ({ Text }))),
    signal: AbortSignal.timeout(timeoutFor(config)),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(httpError("Microsoft Translator", response.status));
  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || payload.length !== texts.length) throw new Error("Microsoft Translator returned an incomplete response.");
  return payload;
}

async function microsoftDetect(texts: string[], config: RuntimeTranslationProviderConfig): Promise<TranslationResult<DetectionResult>> {
  try {
    const chunks = chunksFor(texts, 4_000);
    const detectedChunks: Array<string | null> = [];
    for (const batch of batches(chunks, 25, 5_000)) {
      const results = await microsoftRequest(batch.map((chunk) => chunk.text), "detect", config);
      results.forEach((entry) => {
        if (typeof entry !== "object" || entry === null) {
          detectedChunks.push(null);
          return;
        }
        detectedChunks.push(normalizeLanguageCode((entry as { language?: unknown }).language));
      });
    }
    return { data: mergeDetectedLanguages(texts.length, chunks, detectedChunks) };
  } catch (error) {
    return { error: safeProviderError("Microsoft Translator detection", error) };
  }
}

async function microsoftTranslate(texts: string[], target: TranslationLanguage, config: RuntimeTranslationProviderConfig): Promise<TranslationResult<TranslationProviderOutput[]>> {
  try {
    const chunks = chunksFor(texts, 4_000);
    const translated = texts.map(() => [] as string[]);
    const detected = texts.map(() => new Set<string>());
    for (const batch of batches(chunks, 25, 5_000)) {
      const results = await microsoftRequest(batch.map((chunk) => chunk.text), "translate", config, target);
      results.forEach((entry, index) => {
        const chunk = batch[index];
        if (typeof entry !== "object" || entry === null) throw new Error("Microsoft Translator returned an invalid response.");
        const item = entry as { detectedLanguage?: { language?: unknown }; translations?: Array<{ text?: unknown }> };
        const translatedText = item.translations?.[0]?.text;
        if (typeof translatedText !== "string") throw new Error("Microsoft Translator returned an incomplete translation.");
        translated[chunk.inputIndex][chunk.chunkIndex] = translatedText;
        const language = normalizeLanguageCode(item.detectedLanguage?.language);
        if (language) detected[chunk.inputIndex].add(language);
      });
    }
    return { data: combineResults(texts, translated, detected) };
  } catch (error) {
    return { error: safeProviderError("Microsoft Translator", error) };
  }
}

async function deeplTranslate(texts: string[], target: TranslationLanguage, config: RuntimeTranslationProviderConfig): Promise<TranslationResult<TranslationProviderOutput[]>> {
  try {
    const apiKey = requireApiKey(config, "DeepL");
    const baseUrl = requireHttpBaseUrl(config, "DeepL");
    const chunks = chunksFor(texts, 8_000);
    const translated = texts.map(() => [] as string[]);
    const detected = texts.map(() => new Set<string>());
    const encoder = new TextEncoder();
    const requestBatches: TextChunk[][] = [];
    let current: TextChunk[] = [];
    let currentBytes = 0;
    for (const chunk of chunks) {
      const bytes = encoder.encode(chunk.text).byteLength;
      if (bytes > 90_000) throw new Error("DeepL translation chunk exceeds the request size limit.");
      if (current.length && (current.length >= 50 || currentBytes + bytes > 90_000)) {
        requestBatches.push(current);
        current = [];
        currentBytes = 0;
      }
      current.push(chunk);
      currentBytes += bytes;
    }
    if (current.length) requestBatches.push(current);

    for (const batch of requestBatches) {
      const response = await fetch(`${baseUrl}/v2/translate`, {
        method: "POST",
        headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: batch.map((chunk) => chunk.text), target_lang: target.toUpperCase(), preserve_formatting: true, split_sentences: "nonewlines" }),
        signal: AbortSignal.timeout(timeoutFor(config)),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(httpError("DeepL", response.status));
      const payload = await response.json() as { translations?: Array<{ text?: unknown; detected_source_language?: unknown }> };
      if (!Array.isArray(payload.translations) || payload.translations.length !== batch.length) throw new Error("DeepL returned an incomplete translation response.");
      payload.translations.forEach((item, index) => {
        const chunk = batch[index];
        if (typeof item.text !== "string") throw new Error("DeepL returned an invalid translation.");
        translated[chunk.inputIndex][chunk.chunkIndex] = item.text;
        const language = normalizeLanguageCode(item.detected_source_language);
        if (language) detected[chunk.inputIndex].add(language);
      });
    }
    return { data: combineResults(texts, translated, detected) };
  } catch (error) {
    return { error: safeProviderError("DeepL", error) };
  }
}

async function libreDetect(texts: string[], config: RuntimeTranslationProviderConfig): Promise<TranslationResult<DetectionResult>> {
  try {
    const baseUrl = requireHttpBaseUrl(config, "LibreTranslate");
    const chunks = chunksFor(texts, 1_000);
    const detectedChunks = await mapWithConcurrency(chunks, 5, async (chunk) => {
      const response = await fetch(`${baseUrl}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: chunk.text, ...(config.apiKey ? { api_key: config.apiKey } : {}) }),
        signal: AbortSignal.timeout(timeoutFor(config)),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(httpError("LibreTranslate", response.status));
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) return null;
      const best = payload[0] as { language?: unknown } | undefined;
      return normalizeLanguageCode(best?.language);
    });
    return { data: mergeDetectedLanguages(texts.length, chunks, detectedChunks) };
  } catch (error) {
    return { error: safeProviderError("LibreTranslate detection", error) };
  }
}

async function libreTranslate(texts: string[], target: TranslationLanguage, config: RuntimeTranslationProviderConfig): Promise<TranslationResult<TranslationProviderOutput[]>> {
  try {
    const baseUrl = requireHttpBaseUrl(config, "LibreTranslate");
    const chunks = chunksFor(texts, 1_000);
    const translated = texts.map(() => [] as string[]);
    const detected = texts.map(() => new Set<string>());
    const results = await mapWithConcurrency(chunks, 5, async (chunk) => {
      const response = await fetch(`${baseUrl}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: chunk.text, source: "auto", target, format: "text", ...(config.apiKey ? { api_key: config.apiKey } : {}) }),
        signal: AbortSignal.timeout(timeoutFor(config)),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(httpError("LibreTranslate", response.status));
      const payload = await response.json() as { translatedText?: unknown; detectedLanguage?: { language?: unknown } };
      if (typeof payload.translatedText !== "string") throw new Error("LibreTranslate returned an invalid translation.");
      return {
        translatedText: payload.translatedText,
        detectedSourceLanguage: normalizeLanguageCode(payload.detectedLanguage?.language),
      };
    });
    results.forEach((result, index) => {
      const chunk = chunks[index];
      translated[chunk.inputIndex][chunk.chunkIndex] = result.translatedText;
      if (result.detectedSourceLanguage) detected[chunk.inputIndex].add(result.detectedSourceLanguage);
    });
    return { data: combineResults(texts, translated, detected) };
  } catch (error) {
    return { error: safeProviderError("LibreTranslate", error) };
  }
}

async function lingvaTranslate(texts: string[], target: TranslationLanguage, config: RuntimeTranslationProviderConfig): Promise<TranslationResult<TranslationProviderOutput[]>> {
  try {
    const baseUrl = requireHttpBaseUrl(config, "Lingva");
    const chunks = chunksFor(texts, 2_500);
    const translated = texts.map(() => [] as string[]);
    const detected = texts.map(() => new Set<string>());
    const results = await mapWithConcurrency(chunks, 3, async (chunk) => {
      const response = await fetch(`${baseUrl}/api/v1/auto/${target}`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ query: chunk.text }),
        signal: AbortSignal.timeout(timeoutFor(config)),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(httpError("Lingva", response.status));
      const payload = await response.json() as { translation?: unknown; info?: { detectedSource?: unknown; detectedSourceLanguage?: unknown } };
      if (typeof payload.translation !== "string") throw new Error("Lingva returned an invalid translation response.");
      return {
        translatedText: payload.translation,
        detectedSourceLanguage: normalizeLanguageCode(payload.info?.detectedSource ?? payload.info?.detectedSourceLanguage),
      };
    });
    results.forEach((result, index) => {
      const chunk = chunks[index];
      translated[chunk.inputIndex][chunk.chunkIndex] = result.translatedText;
      if (result.detectedSourceLanguage) detected[chunk.inputIndex].add(result.detectedSourceLanguage);
    });
    return { data: combineResults(texts, translated, detected) };
  } catch (error) {
    return { error: safeProviderError("Lingva", error) };
  }
}


interface ChatTranslationItem { id?: unknown; translatedText?: unknown; detectedSourceLanguage?: unknown }

function parseJsonObject(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(candidate) as unknown;
}

async function aiChatTranslate(texts: string[], target: TranslationLanguage, config: RuntimeTranslationProviderConfig, providerName: string): Promise<TranslationResult<TranslationProviderOutput[]>> {
  try {
    const baseUrl = requireHttpBaseUrl(config, providerName);
    if (!config.model) return { error: `${providerName} model is not configured.` };
    if (providerName === "OpenRouter AI" && !config.apiKey) return { error: "OpenRouter API key is not configured." };

    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
    const languageName = target === "ar" ? "Arabic" : "English";
    const chunks = chunksFor(texts, 8_000);
    const translated = texts.map(() => [] as string[]);
    const detected = texts.map(() => new Set<string>());

    for (const batch of batches(chunks, 8, 8_000)) {
      const inputs = batch.map((chunk, id) => ({ id, text: chunk.text }));
      const totalCodePoints = batch.reduce((sum, chunk) => sum + Array.from(chunk.text).length, 0);
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.model,
          temperature: 0,
          stream: false,
          max_tokens: Math.min(8192, Math.max(1024, Math.ceil(totalCodePoints * 1.5))),
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: `You are a precise translation engine. Translate every input into ${languageName}. Preserve meaning, formatting, identifiers, URLs, code, placeholders and technical terms. Detect the source language of each input separately. Return only valid JSON in this exact shape: {"translations":[{"id":0,"translatedText":"...","detectedSourceLanguage":"en"}]}. Use a two-letter ISO 639-1 code or null for detectedSourceLanguage. Return exactly one item for each input and preserve its id.` },
            { role: "user", content: JSON.stringify({ inputs }) },
          ],
        }),
        signal: AbortSignal.timeout(timeoutFor(config)),
        cache: "no-store",
      });
      if (!response.ok) return { error: httpError(providerName, response.status) };
      const payload = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
      const rawContent = payload.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string"
        ? rawContent
        : Array.isArray(rawContent)
          ? rawContent.map((part) => typeof part === "object" && part !== null && "text" in part && typeof part.text === "string" ? part.text : "").join("")
          : "";
      if (!content) return { error: `${providerName} returned an empty response.` };
      const parsed = parseJsonObject(content) as { translations?: ChatTranslationItem[] };
      if (!Array.isArray(parsed.translations) || parsed.translations.length !== batch.length) return { error: `${providerName} returned an invalid or incomplete translation response.` };
      const byId = new Map<number, ChatTranslationItem>();
      for (const item of parsed.translations) {
        if (typeof item.id !== "number" || byId.has(item.id)) return { error: `${providerName} returned invalid translation IDs.` };
        byId.set(item.id, item);
      }
      for (let index = 0; index < batch.length; index += 1) {
        const chunk = batch[index];
        const item = byId.get(index);
        if (!item || typeof item.translatedText !== "string") return { error: `${providerName} returned an incomplete translation.` };
        translated[chunk.inputIndex][chunk.chunkIndex] = item.translatedText;
        const detectedLanguage = normalizeLanguageCode(item.detectedSourceLanguage);
        if (detectedLanguage) detected[chunk.inputIndex].add(detectedLanguage);
      }
    }
    return { data: combineResults(texts, translated, detected) };
  } catch (error) {
    return { error: safeProviderError(providerName, error) };
  }
}

export const configuredTranslationAdapters: Record<TranslationProviderName, TranslationProviderAdapter> = {
  google: {
    name: "google",
    translateMany: googleTranslate,
    detectLanguages: googleDetect,
  },
  microsoft: {
    name: "microsoft",
    translateMany: microsoftTranslate,
    detectLanguages: microsoftDetect,
  },
  deepl: {
    name: "deepl",
    translateMany: deeplTranslate,
  },
  libretranslate: {
    name: "libretranslate",
    translateMany: libreTranslate,
    detectLanguages: libreDetect,
  },
  lingva: {
    name: "lingva",
    translateMany: lingvaTranslate,
  },
  ai_openrouter: {
    name: "ai_openrouter",
    translateMany: (texts, target, config) => aiChatTranslate(texts, target, config, "OpenRouter AI"),
  },
  ai_local: {
    name: "ai_local",
    translateMany: (texts, target, config) => aiChatTranslate(texts, target, config, "Local AI"),
  },
};

export function getConfiguredTranslationAdapter(type: TranslationProviderName): TranslationProviderAdapter {
  return configuredTranslationAdapters[type];
}

