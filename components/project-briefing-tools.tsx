
"use client";

import { useState } from "react";
import {
  Check,
  ClipboardCopy,
  Download,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { notify } from "@/components/notificationToaster";

type PromptApiResponse = {
  prompt?: unknown;
  error?: unknown;
};

export function ProjectBriefingTools() {
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopyPrompt() {
    if (isCopying) return;

    setIsCopying(true);
    setCopied(false);

    try {
      const response = await fetch("/api/project-briefing-prompt", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const result = (await response.json()) as PromptApiResponse;

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Unable to retrieve the project briefing prompt.",
        );
      }

      if (
        typeof result.prompt !== "string" ||
        !result.prompt.trim()
      ) {
        throw new Error("The API returned an empty or invalid prompt.");
      }

      if (!navigator.clipboard?.writeText) {
        throw new Error(
          "Clipboard access is unavailable. Open the application over HTTPS or localhost and try again.",
        );
      }

      await navigator.clipboard.writeText(result.prompt);

      setCopied(true);

      notify.success(
        "Prompt copied",
        "The project briefing prompt is ready to paste into your AI tool.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      notify.error("Could not copy prompt", message);
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <section className="relative isolate w-full min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card p-4 sm:p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-14 -z-10 size-40 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="max-md:flex-col flex min-w-0 items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Sparkles size={20} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Project preparation
            </p>

            <h2 className="mt-1 break-words text-base font-bold tracking-tight sm:text-lg">
              Project Brief Toolkit
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Turn any existing project documentation into a structured
              academic brief, or download the template to prepare one manually.
            </p>
          </div>
        </div>
        <div className="max-md:flex-1 mt-5 grid min-w-0 grid-cols-1 gap-2 ">
          <Button
            type="button"
            onClick={handleCopyPrompt}
            disabled={isCopying}
            className="min-h-11 w-full justify-center gap-2 rounded-xl px-10"
          >
            {isCopying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : copied ? (
              <Check size={16} />
            ) : (
              <ClipboardCopy size={16} />
            )}

            <span>
              {isCopying
                ? "Retrieving prompt..."
                : copied
                  ? "Prompt copied"
                  : "Copy Project Briefing Prompt"}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-center gap-2 rounded-xl border-border/70 bg-background/60 px-10"
          >
            <a
              href="/project-brief-template.pdf"
              download="project-brief-template.pdf"
              className="flex items-center gap-2"
            >
              <Download size={16} />
              <span>Download Project Brief Template</span>
            </a>
          </Button>
        </div>
      </div>


      <div
        className="mt-4 flex items-start gap-2 border-t border-border/60 pt-4"
        role="status"
        aria-live="polite"
      >
        <FileText
          size={14}
          className="mt-0.5 shrink-0 text-muted-foreground"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          Use the prompt with your AI assistant to organize your project
          information. The PDF provides a structured template for the
          required project details.
        </p>
      </div>
    </section>
  );
}
