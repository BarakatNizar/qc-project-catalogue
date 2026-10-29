
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Sparkles,
  Workflow,
  XCircle,
} from "lucide-react";

import { requireRole } from "@/core/auth/session";
import { aiService } from "@/modules/ai/services/ai-service";
import { PageHeading } from "@/components/ui/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ToggleAIServiceButton from "@/components/ToggleAIServiceButton";

export default async function AdminAiPage() {
  const actor = await requireRole("ADMIN");
  const settings = await aiService.getSettings(actor);

  const enabled = settings.enabled;

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      <PageHeading
        eyebrow="AI governance"
        title="AI service control"
        description="Manage AI suggestion availability, configure generation providers, and investigate execution outcomes from one central workspace."
      />

      {/* Primary service status */}
      <section aria-labelledby="service-status-heading">
        <Card className="relative isolate overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent"
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -right-16 -top-20 -z-10 size-56 rounded-full blur-3xl sm:size-72 ${
              enabled ? "bg-emerald-500/[0.09]" : "bg-muted-foreground/[0.08]"
            }`}
          />

          <CardContent className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <div
                  className={`grid size-12 shrink-0 place-items-center rounded-2xl border sm:size-14 ${
                    enabled
                      ? "border-success/25 bg-success/10 text-success"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  <Bot size={27} strokeWidth={1.7} aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Service status
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2
                        id="service-status-heading"
                        className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                      >
                        New AI suggestions
                      </h2>

                      <Badge
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          enabled
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {enabled ? (
                          <CheckCircle2 size={13} aria-hidden="true" />
                        ) : (
                          <XCircle size={13} aria-hidden="true" />
                        )}
                        {enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      {enabled
                        ? "AI suggestion generation is currently available. Students can request suggestions for project briefs they are permitted to access, subject to the application's existing validation and access rules."
                        : "New AI generation requests are currently disabled. Previously saved project information and suggestions remain available according to the application's existing access rules."}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3.5">
                    <Workflow
                      size={17}
                      className="mt-0.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-xs leading-5 text-muted-foreground sm:text-sm">
                      This control governs whether new AI suggestions can be
                      generated. Provider selection, credentials, and execution
                      priority are managed separately.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 border-t border-border/60 pt-5 lg:w-auto lg:min-w-52 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Current setting
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {enabled ? "Generation available" : "Generation paused"}
                </p>

                <div className="pt-2">
                  <ToggleAIServiceButton currentEnabled={enabled} />
                </div>

                <p className="text-xs leading-5 text-muted-foreground">
                  Applies to new generation requests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Configuration and diagnostics */}
      <section aria-labelledby="configuration-heading" className="space-y-4">
        <div className="space-y-1">
          <h2
            id="configuration-heading"
            className="text-base font-bold tracking-tight text-foreground sm:text-lg"
          >
            Configuration & diagnostics
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Manage the providers that perform generation and review what
            happened when the application runs AI operations.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/admin/ai/providers"
            className="group flex min-w-0 flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <Settings2 size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <LockKeyhole size={12} aria-hidden="true" />
                Admin only
              </span>
            </div>

            <div className="mt-5 flex-1 space-y-2">
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Provider configuration
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Add or edit Local and OpenRouter providers, manage their
                models and credentials, and configure availability, timeouts,
                and execution priority.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
              <span className="text-sm font-semibold text-primary">
                Manage providers
              </span>
              <ArrowRight
                size={16}
                className="shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>

          <Link
            href="/admin/ai/logs"
            className="group flex min-w-0 flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-sky-500/15 bg-sky-500/10 text-sky-700 dark:text-sky-400">
                <Activity size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <FileSearch size={12} aria-hidden="true" />
                Diagnostics
              </span>
            </div>

            <div className="mt-5 flex-1 space-y-2">
              <h3 className="text-base font-bold tracking-tight text-foreground">
                AI execution logs
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Investigate provider attempts, fallback behavior, validation
                errors, failure classifications, execution durations, and
                recorded AI activity.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
              <span className="text-sm font-semibold text-primary">
                Inspect execution logs
              </span>
              <ArrowRight
                size={16}
                className="shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4 sm:p-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background text-primary ring-1 ring-border/70">
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Security and configuration boundaries
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Provider API keys are stored server-side and must never be
              exposed to the browser. The AI system prompt remains fixed in
              application code; provider configuration does not grant
              permission to modify it.
            </p>
          </div>
        </div>
      </section>

      {/* Operational visibility */}
      <section aria-labelledby="observability-heading">
        <Card className="rounded-2xl border border-border/70 bg-card/60 shadow-none">
          <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
              <FileSearch size={20} aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="observability-heading"
                  className="text-base font-bold tracking-tight text-foreground"
                >
                  Operational visibility
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles size={12} aria-hidden="true" />
                  Troubleshooting
                </span>
              </div>

              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Each AI operation is recorded in the unified observability log.
                Use these records to review final outcomes, provider attempts,
                failure classifications, and diagnostic events instead of
                relying solely on application console output.
              </p>

              <Link
                href="/admin/ai/logs"
                className="inline-flex min-h-10 items-center gap-2 pt-1 text-sm font-semibold text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open AI execution logs
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
