// "use client";

// import { useState, useTransition } from "react";
// import { BrainCircuit, Sparkles, RefreshCw, LockKeyhole } from "lucide-react";
// import { requestAiSuggestionsAction } from "@/actions/ai";
// import { Alert } from "@/components/ui/alert";
// import { formatDate } from "@/shared/utils/format";

// type Suggestion = { id: string; content: string; createdAt: Date | string };

// export function AiSuggestionsPanel({ projectId, initialSuggestions, canRequest, aiEnabled }: {
//   projectId: string; initialSuggestions: Suggestion[]; canRequest: boolean; aiEnabled: boolean;
// }) {
//   const [suggestions, setSuggestions] = useState(initialSuggestions);
//   const [error, setError] = useState<string | null>(null);
//   const [notice, setNotice] = useState<string | null>(null);
//   const [isPending, startTransition] = useTransition();

//   function requestSuggestions() {
//     setError(null); setNotice(null);
//     startTransition(async () => {
//       const result = await requestAiSuggestionsAction(projectId);
//       if (!result.ok) { setError(result.error); return; }
//       setSuggestions((current) => {
//         const ids = new Set(current.map((item) => item.id));
//         return [...current, ...result.data.suggestions.filter((item) => !ids.has(item.id))];
//       });
//       setNotice(`Added ${result.data.suggestions.length} new suggestions. They are now shared with everyone viewing this project.`);
//     });
//   }

//   return <section className="panel p-5 sm:p-7" aria-labelledby="ai-suggestions-title">
//     <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="eyebrow mb-2 flex items-center gap-2"><Sparkles size={14} /> AI-assisted inspiration</p><h2 id="ai-suggestions-title" className="text-xl font-extrabold tracking-tight">Feature suggestions</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/60">Suggestions are shared project knowledge. Newly generated ideas are checked against existing suggestions before they are saved.</p></div>
//       {canRequest && <button type="button" className="btn btn-primary shrink-0 gap-2" onClick={requestSuggestions} disabled={isPending || !aiEnabled}>{isPending ? <span className="loading loading-spinner loading-sm" /> : <BrainCircuit size={17} />}{isPending ? "Generating ideas…" : "Suggest New Features"}</button>}
//     </div>
//     {!aiEnabled && canRequest && <div className="mt-5"><Alert type="info"><span className="inline-flex items-center gap-1.5"><LockKeyhole size={15} /> AI generation is currently disabled by the administrator. Existing suggestions remain available.</span></Alert></div>}
//     {error && <div className="mt-5"><Alert type="error">{error}</Alert></div>}
//     {notice && <div className="mt-5"><Alert type="success">{notice}</Alert></div>}
//     {suggestions.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-base-300 px-5 py-8 text-center"><Sparkles className="mx-auto text-accent" size={25} /><p className="mt-3 font-semibold">No suggestions yet</p><p className="mt-1 text-sm text-base-content/55">{canRequest ? "Request a few thoughtful enhancements grounded in this brief." : "Students can request new feature ideas when AI generation is enabled."}</p></div> : <ol className="mt-6 space-y-3">{suggestions.map((suggestion, index) => <li key={suggestion.id} className="flex gap-3 rounded-xl border border-base-300 bg-base-100 p-4"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-bold text-primary">{index + 1}</span><div className="min-w-0"><p className="text-sm leading-7">{suggestion.content}</p><p className="mt-2 text-xs text-base-content/45">Added {formatDate(suggestion.createdAt)}</p></div></li>)}</ol>}
//     {isPending && <p className="mt-4 text-xs text-base-content/50" role="status">The configured AI provider is reviewing this project brief. This may take a short while.</p>}
//     {canRequest && <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-base-content/50"><RefreshCw size={13} className="mt-0.5 shrink-0" />AI output is validated before storage. Requests may fail when providers are unavailable or return too many duplicates; existing suggestions are preserved.</p>}
//   </section>;
// }

"use client";

import { useState, useTransition } from "react";
import { BrainCircuit, Sparkles, RefreshCw, LockKeyhole, Loader2 } from "lucide-react";
import { requestAiSuggestionsAction } from "@/Interfaces/actions/ai.actions";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/shared/utils/format";
import { Button } from "@/components/ui/button";

type Suggestion = { id: string; title: string; content: string; createdAt: Date | string };

export function AiSuggestionsPanel({ projectId, initialSuggestions, canRequest, aiEnabled }: {
  projectId: string; initialSuggestions: Suggestion[]; canRequest: boolean; aiEnabled: boolean;
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestSuggestions() {
    setError(null); setNotice(null);
    startTransition(async () => {
      const result = await requestAiSuggestionsAction({projectId});
      if ("error" in result) { setError(result.error); return; }

      setSuggestions((current) => {
        const ids = new Set(current.map((item) => item.id));

        // Map and ensure each incoming item matches the Suggestion type
        const newSuggestions: Suggestion[] = result.data.suggestions
          .filter((item) => !ids.has(item.id))
          .map((item: any) => ({
            id: item.id,
            title: item.title ?? "Untitled Suggestion", // Fallback if title is missing
            content: item.content,
            createdAt: item.createdAt,
          }));

        return [...current, ...newSuggestions];
      });

      setNotice(`Added ${result.data.suggestions.length} new suggestions. They are now shared with everyone viewing this project.`);
    });
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-6" aria-labelledby="ai-suggestions-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-1.5">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Sparkles size={14} /> AI-assisted inspiration
          </p>
          <h2 id="ai-suggestions-title" className="text-xl font-extrabold tracking-tight">Feature suggestions</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">Suggestions are shared project knowledge. Newly generated ideas are checked against existing suggestions before they are saved.</p>
        </div>
        {canRequest && (
          <Button type="button" onClick={requestSuggestions} disabled={isPending || !aiEnabled} className="rounded-xl shadow-lg shadow-primary/20 shrink-0 gap-2">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={17} />}
            {isPending ? "Generating ideas…" : "Suggest New Features"}
          </Button>
        )}
      </div>

      {!aiEnabled && canRequest && (
        <Alert type="info">
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole size={15} /> AI generation is currently disabled by the administrator. Existing suggestions remain available.
          </span>
        </Alert>
      )}
      {error && <Alert type="error">{error}</Alert>}
      {notice && <Alert type="success">{notice}</Alert>}

      {suggestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2.5">
          <Sparkles className="mx-auto text-accent" size={26} />
          <p className="font-bold text-sm">No suggestions yet</p>
          <p className="text-xs text-muted-foreground">{canRequest ? "Request a few thoughtful enhancements grounded in this brief." : "Students can request new feature ideas when AI generation is enabled."}</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} className="flex gap-3.5 rounded-2xl border border-white/10 bg-background/50 p-4 backdrop-blur-sm">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="font-bold text-[15px]">{suggestion.title}</p>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground">{suggestion.content}</p>
                <p className="font-mono text-[10px] text-muted-foreground/60">Added {formatDate(suggestion.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {isPending && (
        <p className="text-xs text-muted-foreground animate-pulse" role="status">
          The configured AI provider is reviewing this project brief. This may take a short while.
        </p>
      )}
      {canRequest && (
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground/70 border-t border-border/50 pt-4">
          <RefreshCw size={13} className="mt-0.5 shrink-0 text-primary" />
          AI output is validated before storage. Requests may fail when providers are unavailable or return too many duplicates; existing suggestions are preserved.
        </p>
      )}
    </section>
  );
}