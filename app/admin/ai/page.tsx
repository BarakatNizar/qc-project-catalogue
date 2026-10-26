import {
  Bot,
  Settings2,
  ShieldCheck,
  Activity,
  FileSearch,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/core/auth/session";
import { aiService } from "@/modules/ai/services/ai-service";
import { PageHeading } from "@/components/ui/page-heading";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import ToggleAIServiceButton from "@/components/ToggleAIServiceButton";

export default async function AdminAiPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const actor = await requireRole("ADMIN");

  const [settings, query] = await Promise.all([
    aiService.getSettings(actor),
    searchParams,
  ]);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="AI governance"
        title="AI service control"
        description="Manage AI availability, provider configuration, and operational diagnostics."
      />

      {query.error && (
        <Alert type="error">{String(query.error)}</Alert>
      )}

      {query.saved && (
        <Alert type="success">
          AI service setting updated.
        </Alert>
      )}

      {/* Main Status Panel */}
      <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <span
            className={`grid size-14 shrink-0 place-items-center rounded-2xl ${
              settings.enabled
                ? "border border-success/20 bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Bot size={28} />
          </span>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-extrabold tracking-tight">
                New AI suggestions
              </h2>

              <Badge
                className={`rounded-full font-mono text-xs font-semibold uppercase tracking-wider ${
                  settings.enabled
                    ? "border border-success/30 bg-success/20 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {settings.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {settings.enabled
                ? "Students can request AI feature suggestions for visible project briefs. Requests use the configured provider sequence, validate generated output, and persist successful results."
                : "New AI generation requests are disabled. Previously saved project data and suggestions remain available according to existing access rules."}
            </p>

            <ToggleAIServiceButton
              currentEnabled={settings.enabled}
            />
          </div>
        </div>
      </section>

      {/* Provider Configuration Panel */}
      <section className="space-y-6 rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Settings2 size={20} />
          </span>

          <div className="flex-1">
            <h2 className="font-bold tracking-tight">
              AI provider configuration
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Configure provider credentials, models, timeouts,
              availability, and execution order.
            </p>
          </div>

          <Badge className="w-fit rounded-full border border-primary/20 bg-primary/10 text-primary">
            Up to 4 providers
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/ai/providers"
            className="group rounded-2xl border border-border/60 bg-background/50 p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Settings2 size={19} />
              </span>

              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="font-semibold">
                  Manage providers
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Add or edit Local and OpenRouter providers,
                  configure models and credentials, and set
                  their execution priority.
                </p>

                <span className="inline-flex items-center gap-2 pt-1 text-xs font-semibold text-primary">
                  Open provider settings
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/ai/logs"
            className="group rounded-2xl border border-border/60 bg-background/50 p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Activity size={19} />
              </span>

              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="font-semibold">
                  AI execution logs
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Investigate provider failures, fallback attempts,
                  validation errors, execution durations, and
                  historical AI activity.
                </p>

                <span className="inline-flex items-center gap-2 pt-1 text-xs font-semibold text-primary">
                  View diagnostic logs
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-start gap-3 border-t border-border/50 pt-4 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0 text-primary"
          />
          <p>
            Provider API keys are stored server-side and must never
            be exposed to the browser. The AI system prompt remains
            fixed in application code; provider configuration does
            not grant permission to modify it.
          </p>
        </div>
      </section>

      {/* Observability Panel */}
      <section className="rounded-[2rem] border border-border/60 bg-card/60 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <FileSearch size={19} />
          </span>

          <div className="space-y-2">
            <h2 className="font-bold tracking-tight">
              Operational visibility
            </h2>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Each AI operation is recorded in the unified
              observability log. Administrators can review the
              final outcome, provider attempts, failure
              classifications, and diagnostic events without
              relying solely on application console output.
            </p>

            <Link
              href="/admin/ai/logs"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Inspect AI logs
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}