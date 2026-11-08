"use client";

import { useEffect, useState } from "react";
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
import { notify } from "@/components/notificationToaster";
import type { DeleteAiSuggestionActionPayload } from "@/shared/validation/ai-action";
import { t, type Locale } from "@/shared/i18n/dictionary";
import { ConfirmDialog } from "./confirm-dialog";
import { getProjectSuggestionsAction } from "@/Interfaces/getters/project.getters";
import CardSkeleton from "./loaders/CardSkeleton";

type Suggestion = {
  id: string;
  title: string;
  content: string;
  createdAt: Date | string;
};

type SuggestionAdminListProps = {
  projectId: string;
  locale: Locale;
};

export function SuggestionAdminList({
  projectId,
  locale,
}: SuggestionAdminListProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading,setLoading] = useState<boolean>(true);

  const loadingSuggestions=async()=>{
    if(!projectId){
      notify.error("Misisng Project ID","Suggestions Panel missing Project ID")
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getProjectSuggestionsAction(projectId);
      if("error" in res){
        notify.error("Error",res.error);
      }else {
        setSuggestions(res.data.suggestions);
      }
    } catch (error) {
      notify.error(t(locale,'networkError'));
      console.error(error);      
    }finally{
      setLoading(false);
    }
  }


  const handleDelete = async (id: string) => {
    if (deletingIds.has(id)) return;

    setDeletingIds((current) => new Set(current).add(id));

    const toastId = notify.loading(t(locale, "deletingSuggestion"));

    try {
      const payload: DeleteAiSuggestionActionPayload = {
        projectId,
        suggestionId: id,
      };

      const result = await deleteAiSuggestionAction(payload);

      notify.dismiss(toastId);

      if ("error" in result) {
        notify.error(t(locale, "unableToDeleteSuggestion"), result.error);
        return;
      }

      setSuggestions((current) =>
        current.filter((suggestion) => suggestion.id !== id),
      );

      notify.success(
        t(locale, "suggestionDeleted"),
        t(locale, "sharedSuggestionRemoved"),
      );
    } catch (error) {
      console.error("Failed to delete AI suggestion:", error);
      notify.dismiss(toastId);
      notify.error(
        t(locale, "networkError"),
        t(locale, "suggestionDeleteNetworkError"),
      );
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };
  useEffect(()=>{
    loadingSuggestions();
  },[])

  if (loading)
    return <CardSkeleton />

  if (suggestions.length === 0 && !loading) {
    return (
      <div className="flex min-w-0 flex-col items-center rounded-2xl border border-dashed border-border/80 bg-background/40 p-6 text-center sm:p-8">
        <span className="grid size-12 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-sm">
          <MessageSquareText size={22} />
        </span>

        <h3 className="mt-4 text-base font-bold text-foreground sm:text-lg">
          {t(locale, "noSharedSuggestions")}
        </h3>

        <p className="mt-1.5 max-w-sm text-[16px] leading-relaxed text-muted-foreground sm:text-lg">
          {t(locale, "noSharedSuggestionsDesc")}
        </p>
      </div>
    );
  }

  return (
    <section
      className="min-w-0 space-y-4"
      aria-label={t(locale, "manageAiSuggestions")}
    >
      {/* List summary banner */}
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Sparkles size={17} />
          </span>

          <div className="min-w-0 space-y-0.5">
            <p className="text-lg font-bold text-foreground sm:text-base">
              {t(locale, "sharedIdeas")}
            </p>
            <p className="text-[16px] text-muted-foreground sm:text-lg">
              {t(locale, "visibleInProjectSuggestions")}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-xl border border-primary/30 bg-background/90 px-3 py-1 font-mono text-base font-extrabold tabular-nums text-primary shadow-xs">
          {suggestions.length}
        </span>
      </div>

      {/* Suggestion cards */}
      <ol className="max-h-[700px] space-y-3 overflow-y-auto pr-1">
        {suggestions.map((suggestion, index) => {
          const isDeleting = deletingIds.has(suggestion.id);

          return (
            <li
              key={suggestion.id}
              className="group min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card/60 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              <details className="group/details">
                <summary className="flex cursor-pointer list-none items-start gap-3.5 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 font-mono text-[16px] font-bold text-primary shadow-2xs">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="break-words text-base font-bold leading-snug text-foreground [overflow-wrap:anywhere] sm:text-lg">
                      {suggestion.title?.trim() ||
                        t(locale, "untitledSuggestion")}
                    </h3>

                    <p className="text-[16px] text-muted-foreground">
                      {t(locale, "suggestionAdded")}{" "}
                      <span className="font-medium text-foreground/80">
                        {formatDate(suggestion.createdAt)}
                      </span>
                    </p>

                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-primary transition-colors hover:text-primary/80">
                        <MessageSquareText size={13} className="shrink-0" />
                        <span className="group-open/details:hidden">
                          {t(locale, "readSuggestionDetails")}
                        </span>
                        <span className="hidden group-open/details:inline">
                          {t(locale, "hideSuggestionDetails")}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Confirmation control retains existing delete workflow */}
                    <div className="relative z-10">
                      <ConfirmDialog
                        onCertain={() => handleDelete(suggestion.id)}
                        style="warn"
                        title={t(
                          locale,
                          "permanentlyRemoveSuggestionConfirm",
                        )}
                        // t(locale, "permanentlyRemoveSuggestion")
                        // t(
                        //   locale,
                        //   "permanentlyRemoveSuggestionAria",
                        // ).replace(
                        //   "{title}",
                        //   suggestion.title || t(locale, "suggestion"),
                        // )

                        triggerChildren={
                          <div className="inline-flex size-9 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"   >

                            {isDeleting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </div>
                        }
                      />
                    </div>

                    <ChevronDown
                      size={18}
                      className="shrink-0 text-muted-foreground transition-transform duration-200 group-open/details:rotate-180"
                      aria-hidden="true"
                    />
                  </div>
                </summary>

                <div className="border-t border-border/70 bg-background/60 px-4 py-4 sm:px-6 sm:py-5">
                  <p className="whitespace-pre-line break-words text-[16px] sm:text-lg leading-relaxed text-foreground/90 [overflow-wrap:anywhere]">
                    {suggestion.content}
                  </p>
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      {/* Permanent deletion information note */}
      <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-4">
        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
        />

        <p className="text-[16px] leading-relaxed text-muted-foreground sm:text-lg">
          {t(locale, "manageSuggestionsWarning")}
        </p>
      </div>

      {deletingIds.size > 0 && (
        <p
          className="flex items-center gap-2 text-[16px] text-muted-foreground sm:text-lg"
          role="status"
        >
          <CheckCircle2 size={14} className="shrink-0 text-primary" />
          {t(locale, "updatingSharedSuggestions")}
        </p>
      )}
    </section>
  );
}