
"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquareText,
  Sparkles,
  Trash2,
} from "lucide-react";

import { deleteAiSuggestionAction } from "@/Interfaces/actions/ai.actions";
import { formatDate } from "@/shared/utils/format";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { notify } from "@/components/notificationToaster";
import type { DeleteAiSuggestionActionPayload } from "@/shared/validation/ai-action";

type Suggestion = {
  id: string;
  title: string;
  content: string;
  createdAt: Date | string;
};

type SuggestionAdminListProps = {
  projectId: string;
  suggestions: Suggestion[];
};

export function SuggestionAdminList({
  projectId,
  suggestions: initialSuggestions,
}: SuggestionAdminListProps) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(
    () => new Set(),
  );

  const handleDelete = async (id: string) => {
    if (deletingIds.has(id)) return;

    setDeletingIds((current) => new Set(current).add(id));

    const toastId = notify.loading("Deleting suggestion...");

    try {
      const payload: DeleteAiSuggestionActionPayload = {
        projectId,
        suggestionId: id,
      };

      const result = await deleteAiSuggestionAction(payload);

      notify.dismiss(toastId);

      if ("error" in result) {
        notify.error("Unable to delete suggestion", result.error);
        return;
      }

      setSuggestions((current) =>
        current.filter((suggestion) => suggestion.id !== id),
      );

      notify.success(
        "Suggestion deleted",
        "The shared suggestion has been removed.",
      );
    } catch (error) {
      console.error("Failed to delete AI suggestion:", error);
      notify.dismiss(toastId);
      notify.error(
        "Network error",
        "The suggestion could not be deleted. Please try again.",
      );
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="flex min-w-0 flex-col items-center rounded-xl border border-dashed border-border/70 bg-background/30 px-4 py-8 text-center">
        <span className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <MessageSquareText size={20} />
        </span>

        <h3 className="mt-3 text-sm font-bold">
          No shared suggestions
        </h3>

        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          Suggestions generated for this project will appear here. You can
          review and remove them from the shared list.
        </p>
      </div>
    );
  }

  return (
    <section className="min-w-0 space-y-3" aria-label="Manage AI suggestions">
      {/* List summary */}
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.05] p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sparkles size={16} />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold">Shared ideas</p>
            <p className="text-xs text-muted-foreground">
              Visible in project suggestions
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-lg border border-primary/20 bg-background/80 px-2.5 py-1 font-mono text-sm font-bold tabular-nums text-primary">
          {suggestions.length}
        </span>
      </div>

      {/* Suggestion cards */}
      <ol className="space-y-2.5 overflow-y-auto max-h-[700px]">
        {suggestions.map((suggestion, index) => {
          const isDeleting = deletingIds.has(suggestion.id);

          return (
            <li
              key={suggestion.id}
              className="group min-w-0 overflow-hidden rounded-xl border border-border/70 bg-background/30 transition-colors hover:border-primary/25"
            >
              <div className="flex min-w-0 items-start gap-3 p-3 sm:p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/[0.08] font-mono text-xs font-bold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold leading-5 [overflow-wrap:anywhere]">
                    {suggestion.title?.trim() || "Untitled suggestion"}
                  </h3>

                  <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">
                    Added {formatDate(suggestion.createdAt)}
                  </p>
                </div>

                {/* Confirmation control retains the existing delete workflow. */}
                <div className="relative z-10 shrink-0">
                  <ConfirmSubmitButton
                    onClick={() => handleDelete(suggestion.id)}
                    confirmMessage="Permanently remove this shared suggestion? It will no longer be included in future AI context."
                    aria-label={`Permanently remove ${suggestion.title || "suggestion"}`}
                    title="Permanently remove suggestion"
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </ConfirmSubmitButton>
                </div>
              </div>

              {/* Expandable content: collapsed by default */}
              <details className="group/details border-t border-border/50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/[0.035] hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <MessageSquareText
                      size={14}
                      className="shrink-0 text-primary"
                    />
                    <span className="group-open/details:hidden">
                      Read suggestion details
                    </span>
                    <span className="hidden group-open/details:inline">
                      Hide suggestion details
                    </span>
                  </span>

                  <ChevronDown
                    size={15}
                    className="shrink-0 transition-transform group-open/details:rotate-180"
                    aria-hidden="true"
                  />
                </summary>

                <div className="border-t border-border/50 bg-card/40 px-4 py-4">
                  <p className="whitespace-pre-line break-words text-sm leading-6 text-foreground/85 [overflow-wrap:anywhere]">
                    {suggestion.content}
                  </p>
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      {/* Permanent deletion information */}
      <div className="flex min-w-0 items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.045] p-3">
        <AlertTriangle
          size={15}
          className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
        />

        <p className="text-xs leading-5 text-muted-foreground">
          Removing a suggestion permanently removes it from the shared list
          and future AI context. Its parent AI response remains available
          for history.
        </p>
      </div>

      {deletingIds.size > 0 && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <CheckCircle2 size={14} className="shrink-0 text-primary" />
          Updating the shared suggestions list...
        </p>
      )}
    </section>
  );
}
