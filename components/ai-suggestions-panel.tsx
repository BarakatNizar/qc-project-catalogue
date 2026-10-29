
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
};

export function AiSuggestionsPanel({
  projectId,
  initialSuggestions,
  canRequest,
  aiEnabled,
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
          title: item.title?.trim() || "Untitled suggestion",
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
          `Added ${addedCount} new ${addedCount === 1 ? "suggestion" : "suggestions"}. The ideas are now shared with everyone viewing this project.`,
        );
      } else {
        setNotice(
          "The AI did not return any new suggestions. Existing suggestions have been preserved.",
        );
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
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              AI-assisted discovery
            </p>

            <h2
              id="ai-suggestions-title"
              className="mt-1 break-words text-base font-bold tracking-tight sm:text-lg"
            >
              Feature suggestions
            </h2>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Explore possible enhancements grounded in this project's brief.
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-semibold tabular-nums">
            <Sparkles size={12} className="text-primary" />
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
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}

            {isPending ? "Generating ideas..." : "Suggest new features"}
          </Button>
        )}

        {!canRequest && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/60 bg-background/40 p-3">
            <LockKeyhole
              size={15}
              className="mt-0.5 shrink-0 text-muted-foreground"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              AI suggestions are available for viewing. Your current
              permissions do not allow generating new suggestions.
            </p>
          </div>
        )}

        {canRequest && !aiEnabled && (
          <Alert type="info">
            <span className="flex items-start gap-2">
              <LockKeyhole size={15} className="mt-0.5 shrink-0" />
              <span className="text-sm leading-5">
                AI generation is currently disabled by the administrator.
                Existing suggestions remain available.
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
                <span className="break-words text-sm leading-5">{error}</span>
              </span>
            </Alert>
          )}

          {notice && (
            <Alert type="success">
              <span className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                <span className="break-words text-sm leading-5">{notice}</span>
              </span>
            </Alert>
          )}
        </div>
      )}

      {/* Suggestions list */}
      <div className="space-y-3 p-3 sm:p-4">
        <div className="flex min-w-0 items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <h3 className="text-sm font-bold">Shared ideas</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Open an idea to read the full description.
            </p>
          </div>

          {suggestions.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {suggestions.length} total
            </span>
          )}
        </div>

        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border/70 bg-background/20 px-4 py-8 text-center">
            <span className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Lightbulb size={20} />
            </span>

            <h3 className="mt-3 text-sm font-bold">
              No suggestions yet
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
              {canRequest && aiEnabled
                ? "Generate ideas to explore additional features and improvements for this project."
                : "There are no shared feature suggestions available yet."}
            </p>

            {canRequest && aiEnabled && (
              <button
                type="button"
                onClick={requestSuggestions}
                disabled={isPending}
                className="mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Generate first ideas
              </button>
            )}
          </div>
        ) : (
          <ol className="space-y-2 overflow-y-auto max-h-[700px]">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id} className="min-w-0">
                <details className="group min-w-0 overflow-hidden rounded-xl border border-border/60 bg-background/25 transition-colors open:border-primary/30 open:bg-background/45">
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-3.5 [&::-webkit-details-marker]:hidden sm:p-4">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/[0.08] font-mono text-xs font-bold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold leading-5 text-foreground [overflow-wrap:anywhere]">
                        {suggestion.title || "Untitled suggestion"}
                      </span>

                      <span className="mt-1.5 block text-[10px] text-muted-foreground">
                        Added {formatDate(suggestion.createdAt)}
                      </span>

                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                        <span className="group-open:hidden">
                          Read full idea
                        </span>
                        <span className="hidden group-open:inline">
                          Hide details
                        </span>
                      </span>
                    </span>

                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>

                  <div className="border-t border-border/60 px-4 py-4 sm:px-5">
                    <p className="whitespace-pre-line break-words text-sm leading-6 text-foreground/85 [overflow-wrap:anywhere]">
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
            <p className="text-xs leading-5 text-muted-foreground">
              The configured AI provider is reviewing this project brief.
              Existing suggestions are preserved while the request runs.
            </p>
          </div>
        )}

        {canRequest && (
          <div className="flex items-start gap-2 border-t border-border/60 px-1 pt-4">
            <RefreshCw
              size={13}
              className="mt-0.5 shrink-0 text-primary"
            />
            <p className="text-[11px] leading-5 text-muted-foreground">
              AI output is validated before storage. Generation can fail if
              providers are unavailable or return duplicate ideas.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
