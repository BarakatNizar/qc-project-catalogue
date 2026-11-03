
"use client";

import { useState, useTransition } from "react";
import {
  BrainCircuit,
  Sparkles,
  RefreshCw,
  LockKeyhole,
  Loader2,
  ChevronDown,
  Lightbulb,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { requestAiSuggestionsAction } from "@/Interfaces/actions/ai.actions";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/shared/utils/format";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/shared/i18n/dictionary";

type Suggestion = {
  id: string;
  title: string;
  content: string;
  createdAt: Date | string;
};

type AiSuggestionsPanelProps = {
  projectId: string;
  initialSuggestions: Suggestion[];
  canRequest: boolean;
  aiEnabled: boolean;
  locale: Locale;
};

export function AiSuggestionsPanel({
  projectId,
  initialSuggestions,
  canRequest,
  aiEnabled,
  locale,
}: AiSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestSuggestions() {
    if (isPending || !canRequest || !aiEnabled) return;

    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await requestAiSuggestionsAction({ projectId });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      const incomingSuggestions: Suggestion[] =
        result.data.suggestions.map((item) => ({
          id: item.id,
          title: item.title?.trim() || t(locale, "untitledSuggestion"),
          content: item.content,
          createdAt: item.createdAt,
        }));

      let addedCount = 0;

      setSuggestions((current) => {
        const existingIds = new Set(current.map((item) => item.id));

        const newSuggestions = incomingSuggestions.filter(
          (item) => !existingIds.has(item.id),
        );

        addedCount = newSuggestions.length;

        return [...current, ...newSuggestions];
      });

      if (addedCount > 0) {
        setNotice(
          t(locale, "aiSuggestionsAddedNotice")
            .replace("{count}", String(addedCount))
            .replace(
              "{plural}",
              addedCount === 1
                ? t(locale, "suggestion")
                : t(locale, "suggestions"),
            ),
        );
      } else {
        setNotice(t(locale, "aiSuggestionsAddedNotice"));
      }
    });
  }

  return (
    <section
      aria-labelledby="ai-suggestions-title"
      className="w-full min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card/75"
    >
      {/* Header */}
      <div className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/[0.10] via-card to-card p-4 sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 -z-10 size-40 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <BrainCircuit size={20} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold uppercase tracking-wide text-primary">
              {t(locale, "aiAssistedDiscovery")}
            </p>

            <h2
              id="ai-suggestions-title"
              className="mt-1 break-words text-base font-bold tracking-tight text-lg sm:text-lg"
            >
              {t(locale, "featureSuggestions")}
            </h2>

            <p className="mt-1 text-[16px] leading-6 opacity-85">
              {t(locale, "featureSuggestionsDesc")}
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[16px] font-semibold tabular-nums">
            <Sparkles size={17} className="text-primary" />
            {suggestions.length}
          </span>
        </div>

        {/* Generate action */}
        {canRequest && (
          <Button
            type="button"
            onClick={requestSuggestions}
            disabled={isPending || !aiEnabled}
            className="mt-4 min-h-11 w-full gap-2 rounded-xl"
          >
            {isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Sparkles size={20} />
            )}

            {isPending
              ? t(locale, "generatingIdeas")
              : t(locale, "suggestNewFeatures")}
          </Button>
        )}

        {!canRequest && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/60 bg-background/40 p-3">
            <LockKeyhole
              size={15}
              className="mt-0.5 shrink-0 opacity-85"
            />
            <p className="text-[16px] leading-6 opacity-85">
              {t(locale, "aiSuggestionsViewOnlyNotice")}
            </p>
          </div>
        )}

        {canRequest && !aiEnabled && (
          <Alert type="info">
            <span className="flex items-start gap-2">
              <LockKeyhole size={15} className="mt-0.5 shrink-0" />
              <span className="text-lg leading-6">
                {t(locale, "aiGenerationDisabledNotice")}
              </span>
            </span>
          </Alert>
        )}
      </div>

      {/* Feedback */}
      {(error || notice) && (
        <div className="space-y-2 border-b border-border/60 p-4">
          {error && (
            <Alert type="error">
              <span className="flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span className="break-words text-lg leading-6">
                  {error}
                </span>
              </span>
            </Alert>
          )}

          {notice && (
            <Alert type="success">
              <span className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                <span className="break-words text-lg leading-6">
                  {notice}
                </span>
              </span>
            </Alert>
          )}
        </div>
      )}

      {/* Suggestions list */}
      <div className="space-y-3 p-3 sm:p-4">
        <div className="flex min-w-0 items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <h3 className="text-lg font-bold">
              {t(locale, "sharedIdeas")}
            </h3>
            <p className="mt-0.5 text-[16px] opacity-85">
              {t(locale, "openIdeaToReadDescription")}
            </p>
          </div>

          {suggestions.length > 0 && (
            <span className="shrink-0 text-[16px] opacity-85">
              {suggestions.length} {t(locale, "total")}
            </span>
          )}
        </div>

        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border/70 bg-background/20 px-4 py-8 text-center">
            <span className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Lightbulb size={20} />
            </span>

            <h3 className="mt-3 text-lg font-bold">
              {t(locale, "noSuggestionsYet")}
            </h3>

            <p className="mt-1 max-w-xs text-[16px] leading-6 opacity-85">
              {canRequest && aiEnabled
                ? t(locale, "generateIdeasEmptyDesc")
                : t(locale, "noSharedFeatureSuggestionsDesc")}
            </p>

            {canRequest && aiEnabled && (
              <button
                type="button"
                onClick={requestSuggestions}
                disabled={isPending}
                className="mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2 text-[16px] font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {t(locale, "generateFirstIdeas")}
              </button>
            )}
          </div>
        ) : (
          <ol className="max-h-[700px] space-y-2 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id} className="min-w-0">
                <details className="group min-w-0 overflow-hidden rounded-xl border border-border/60 bg-background/25 transition-colors open:border-primary/30 open:bg-background/45">
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-3.5 [&::-webkit-details-marker]:hidden sm:p-4">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/[0.08] font-mono text-[16px] font-bold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-lg font-semibold leading-6 text-foreground [overflow-wrap:anywhere]">
                        {suggestion.title || t(locale, "untitledSuggestion")}
                      </span>

                      <span className="mt-1.5 block text-[14px] opacity-85">
                        {t(locale, "suggestionAdded")}{" "}
                        {formatDate(suggestion.createdAt)}
                      </span>

                      <span className="mt-2 inline-flex items-center gap-1.5 text-[16px] font-medium text-primary">
                        <span className="group-open:hidden">
                          {t(locale, "readFullIdea")}
                        </span>
                        <span className="hidden group-open:inline">
                          {t(locale, "hideSuggestionDetails")}
                        </span>
                      </span>
                    </span>

                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 opacity-85 transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>

                  <div className="border-t border-border/60 px-4 py-4 sm:px-5">
                    <p className="whitespace-pre-line break-words text-lg leading-6 text-foreground/85 [overflow-wrap:anywhere]">
                      {suggestion.content}
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}

        {isPending && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.05] p-3"
          >
            <Loader2
              size={15}
              className="mt-0.5 shrink-0 animate-spin text-primary"
            />
            <p className="text-[16px] leading-6 opacity-85">
              {t(locale, "aiProviderReviewingBrief")}
            </p>
          </div>
        )}

        {canRequest && (
          <div className="flex items-start gap-2 border-t border-border/60 px-1 pt-4">
            <RefreshCw
              size={13}
              className="mt-0.5 shrink-0 text-primary"
            />
            <p className="text-[14px] leading-6 opacity-85">
              {t(locale, "aiSuggestionValidationNotice")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
