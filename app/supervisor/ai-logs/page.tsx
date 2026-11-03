// /supervisor/ai-logs/page.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileJson,
  FileSearch,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { getAiLogsAction } from "@/Interfaces/getters/ai-logs.getters";
import { type AiLogsFilters } from "@/shared/validation/ai-logs";
import { notify } from "@/components/notificationToaster";

const INITIAL_FILTERS: AiLogsFilters = {
  from: "",
  to: "",
  operation: "",
  status: "",
  level: "",
  provider: "",
  query: "",
  page: 1,
};

function badgeClass(value: string): string {
  if (value === "FAILED" || value === "ERROR") {
    return "border-error/30 bg-error/10 text-error";
  }

  if (value === "RUNNING" || value === "WARN") {
    return "border-warning/30 bg-warning/10 text-warning";
  }

  if (value === "SUCCEEDED" || value === "INFO") {
    return "border-success/30 bg-success/10 text-success";
  }

  return "border-border bg-muted text-muted-foreground";
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (!Number.isFinite(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? [], null, 2) ?? "[]";
}

function operationLabel(operation: string): string {
  if (operation === "PROJECT_EXTRACTION") return "Project extraction";
  if (operation === "SUGGESTIONS") return "Suggestions";
  return operation;
}

function hasActiveFilters(filters: AiLogsFilters): boolean {
  return Boolean(
    filters.from ||
      filters.to ||
      filters.operation ||
      filters.status ||
      filters.level ||
      filters.provider ||
      filters.query.trim(),
  );
}

type LogData = Awaited<ReturnType<typeof getAiLogsAction>>["data"];

export default function AdminAiLogsPage() {
  const [draftFilters, setDraftFilters] =
    useState<AiLogsFilters>(INITIAL_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<AiLogsFilters>(INITIAL_FILTERS);

  const [page, setPage] = useState(1);
  const [data, setData] = useState<LogData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const fetchLogs = useCallback(async (filters: AiLogsFilters) => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setRequestError(null);

    try {
      const result = await getAiLogsAction(filters);

      // Ignore a response if a newer request has already started.
      if (requestId !== requestIdRef.current) return;

      if ("error" in result) {
        setData(null);
        setRequestError(result.error!);
        notify.error("Error", result.error);
        return;
      }

      setData(result.data);
      notify.success("Logs Loaded");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      console.error("Failed to load AI execution logs:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to load AI execution logs. Please try again.";

      setData(null);
      setRequestError(message);
      notify.error("Error", message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchLogs(INITIAL_FILTERS);

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchLogs]);

  const updateFilter = <K extends keyof AiLogsFilters>(
    key: K,
    value: AiLogsFilters[K],
  ) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
      page: 1,
    }));
  };

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFilters: AiLogsFilters = {
      ...draftFilters,
      query: draftFilters.query.trim(),
      page: 1,
    };

    setAppliedFilters(nextFilters);
    setPage(1);
    void fetchLogs(nextFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { ...INITIAL_FILTERS };

    setDraftFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    setPage(1);

    void fetchLogs(clearedFilters);
  };

  const handlePageChange = (nextPage: number) => {
    if (!data || isLoading) return;
    if (nextPage < 1 || nextPage > data.totalPages) return;

    const nextFilters: AiLogsFilters = {
      ...appliedFilters,
      page: nextPage,
    };

    setPage(nextPage);
    setAppliedFilters(nextFilters);

    void fetchLogs(nextFilters);
  };

  const activeFilters = hasActiveFilters(appliedFilters);

  const visibleRange =
    data && data.total > 0
      ? {
          start: (data.page - 1) * data.pageSize + 1,
          end: Math.min(data.page * data.pageSize, data.total),
        }
      : null;

  return (
    <main dir="ltr" className="mx-auto min-w-0 max-w-screen-3xl space-y-8">
      {/* Page header */}
      <header className="space-y-5 border-b border-border/70 pb-6 sm:pb-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Activity size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Observability
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  AI execution logs
                </h1>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Investigate generation and extraction operations, inspect provider
              attempts, and trace failures using structured diagnostic records.
              Each database row represents one AI operation, with its provider
              attempts and diagnostic events stored as structured data.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={13} aria-hidden="true" />
                Dates and times displayed in UTC
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileJson size={13} aria-hidden="true" />
                Structured execution diagnostics
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-[420px]:flex-row xl:shrink-0">
            <Link
              href="/admin/ai/providers"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Server size={15} aria-hidden="true" />
              Provider settings
            </Link>

            <Link
              href="/admin/ai"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              AI service control
            </Link>
          </div>
        </div>
      </header>

      {/* Filter panel */}
      <section
        aria-labelledby="filters-heading"
        className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2
                id="filters-heading"
                className="text-base font-bold tracking-tight text-foreground"
              >
                Filter executions
              </h2>
              <p className="text-xs leading-5 text-muted-foreground sm:text-sm">
                Narrow the results by date, operation, outcome, provider, or
                diagnostic text.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={isLoading && !data}
            className="inline-flex min-h-9 w-fit items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={15} aria-hidden="true" />
            Reset filters
          </button>
        </div>

        <form onSubmit={handleApplyFilters} className="space-y-5 p-5 sm:p-6">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                From date
              </span>
              <span className="text-xs text-muted-foreground">
                Start of the UTC date range
              </span>
              <span className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  className="input input-bordered min-w-0 w-full pl-9"
                  type="date"
                  value={draftFilters.from}
                  onChange={(event) => updateFilter("from", event.target.value)}
                />
              </span>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                To date
              </span>
              <span className="text-xs text-muted-foreground">
                End of the UTC date range
              </span>
              <span className="relative">
                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  className="input input-bordered min-w-0 w-full pl-9"
                  type="date"
                  value={draftFilters.to}
                  onChange={(event) => updateFilter("to", event.target.value)}
                />
              </span>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                Operation
              </span>
              <span className="text-xs text-muted-foreground">
                Type of AI task
              </span>
              <select
                className="select select-bordered min-w-0 w-full"
                value={draftFilters.operation}
                onChange={(event) =>
                  updateFilter(
                    "operation",
                    event.target.value as AiLogsFilters["operation"],
                  )
                }
              >
                <option value="">All operations</option>
                <option value="SUGGESTIONS">Suggestions</option>
                <option value="PROJECT_EXTRACTION">Project extraction</option>
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                Execution status
              </span>
              <span className="text-xs text-muted-foreground">
                Final operation outcome
              </span>
              <select
                className="select select-bordered min-w-0 w-full"
                value={draftFilters.status}
                onChange={(event) =>
                  updateFilter(
                    "status",
                    event.target.value as AiLogsFilters["status"],
                  )
                }
              >
                <option value="">All statuses</option>
                <option value="RUNNING">Running</option>
                <option value="SUCCEEDED">Succeeded</option>
                <option value="FAILED">Failed</option>
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                Severity
              </span>
              <span className="text-xs text-muted-foreground">
                Diagnostic event level
              </span>
              <select
                className="select select-bordered min-w-0 w-full"
                value={draftFilters.level}
                onChange={(event) =>
                  updateFilter(
                    "level",
                    event.target.value as AiLogsFilters["level"],
                  )
                }
              >
                <option value="">All levels</option>
                <option value="INFO">Info</option>
                <option value="WARN">Warning</option>
                <option value="ERROR">Error</option>
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                Provider
              </span>
              <span className="text-xs text-muted-foreground">
                Used or attempted during execution
              </span>
              <select
                className="select select-bordered min-w-0 w-full"
                value={draftFilters.provider}
                onChange={(event) =>
                  updateFilter(
                    "provider",
                    event.target.value as AiLogsFilters["provider"],
                  )
                }
              >
                <option value="">All providers</option>
                <option value="OPENROUTER">OpenRouter</option>
                <option value="LOCAL">Local</option>
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-semibold text-foreground">
                Search diagnostics
              </span>
              <span className="text-xs text-muted-foreground">
                Search using an identifier or provider detail
              </span>
              <span className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  className="input input-bordered min-w-0 w-full pl-9"
                  type="search"
                  maxLength={100}
                  placeholder="Trace ID, error code, provider, or model"
                  value={draftFilters.query}
                  onChange={(event) => updateFilter("query", event.target.value)}
                />
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <CircleHelp
                size={15}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>
                Filters apply when submitted. Results are ordered newest first,
                with up to 25 executions per page.
              </span>
            </p>

            <button
              className="btn btn-primary min-h-11 w-full shrink-0 sm:w-auto"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Filter size={16} aria-hidden="true" />
              )}
              {isLoading ? "Loading executions..." : "Apply filters"}
            </button>
          </div>
        </form>
      </section>

      {/* Results */}
      <section aria-labelledby="executions-heading" className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2
              id="executions-heading"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              Execution records
            </h2>
            <p className="text-sm text-muted-foreground">
              Review each operation and expand its diagnostics when needed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeFilters ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Filter size={12} aria-hidden="true" />
                Filters applied
              </span>
            ) : null}

            {data ? (
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {data.total} {data.total === 1 ? "execution" : "executions"}
              </span>
            ) : null}

            {data && !isLoading ? (
              <button
                type="button"
                onClick={() => void fetchLogs(appliedFilters)}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw size={13} aria-hidden="true" />
                Refresh
              </button>
            ) : null}
          </div>
        </div>

        {isLoading && data ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
          >
            <LoaderCircle
              size={16}
              className="animate-spin text-primary"
              aria-hidden="true"
            />
            Updating execution records...
          </div>
        ) : null}

        {isLoading && !data ? (
          <div
            role="status"
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-5 py-14 text-center"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <LoaderCircle size={24} className="animate-spin" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Loading execution records
              </p>
              <p className="text-sm text-muted-foreground">
                Retrieving matching operations and diagnostic summaries.
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && requestError && !data ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-4 rounded-2xl border border-error/25 bg-error/5 p-5 sm:flex-row sm:items-center sm:p-6"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-error/10 text-error">
              <AlertCircle size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-semibold text-foreground">
                Unable to load execution records
              </h3>
              <p className="break-words text-sm leading-6 text-muted-foreground">
                {requestError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchLogs(appliedFilters)}
              className="btn btn-outline btn-sm shrink-0"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && data && data.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-5 py-12 text-center sm:py-16">
            <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <FileSearch size={25} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-bold text-foreground">
              No matching executions
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              No AI operations match the currently applied filters. Try a wider
              date range or remove one or more filter conditions.
            </p>
            {activeFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-outline btn-sm mt-5"
              >
                <X size={14} aria-hidden="true" />
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}

        {data?.logs.length ? (
          <div className="space-y-4">
            {data.logs.map((log) => (
              <article
                key={log.id}
                className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-colors hover:border-border"
              >
                <div className="space-y-5 p-4 sm:p-5 lg:p-6">
                  {/* Status and operation */}
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClass(log.status)}`}
                        >
                          {log.status === "SUCCEEDED" ? (
                            <CheckCircle2 size={12} aria-hidden="true" />
                          ) : log.status === "FAILED" ? (
                            <XCircle size={12} aria-hidden="true" />
                          ) : log.status === "RUNNING" ? (
                            <LoaderCircle size={12} aria-hidden="true" />
                          ) : (
                            <Activity size={12} aria-hidden="true" />
                          )}
                          {log.status}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(log.level)}`}
                        >
                          <span className="opacity-70">Level</span>
                          {log.level}
                        </span>

                        <span className="inline-flex max-w-full items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {operationLabel(log.operation)}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Trace identifier
                        </p>
                        <p className="break-all font-mono text-xs leading-5 text-foreground sm:text-sm">
                          {log.traceId}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 rounded-xl border border-border/60 bg-muted/20 p-3.5 xl:w-[min(100%,24rem)] xl:shrink-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Final provider
                      </p>
                      <p className="mt-1 break-words text-sm font-bold text-foreground">
                        {log.finalProviderName ||
                          (log.providerTypes.length
                            ? log.providerTypes.join(" → ")
                            : "No provider attempted")}
                      </p>
                      <p className="mt-1 break-all text-xs leading-5 text-muted-foreground">
                        {log.finalModel ?? "No successful provider"}
                      </p>
                    </div>
                  </div>

                  {/* Execution metadata */}
                  <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="min-w-0 rounded-xl border border-border/60 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <CalendarDays size={14} aria-hidden="true" />
                        Started at (UTC)
                      </div>
                      <p className="mt-2 break-words text-sm font-semibold leading-5 text-foreground">
                        {formatDate(log.startedAt)}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-xl border border-border/60 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock3 size={14} aria-hidden="true" />
                        Duration
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {log.durationMs === null
                          ? "In progress"
                          : `${log.durationMs.toLocaleString()} ms`}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-xl border border-border/60 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <UserRound size={14} aria-hidden="true" />
                        Triggered by
                      </div>
                      <p className="mt-2 break-words text-sm font-semibold leading-5 text-foreground">
                        {log.triggeredByUser?.name ?? "Deleted or unavailable"}
                      </p>
                    </div>

                    <div className="min-w-0 rounded-xl border border-border/60 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <FileSearch size={14} aria-hidden="true" />
                        Project
                      </div>
                      <p className="mt-2 break-words text-sm font-semibold leading-5 text-foreground">
                        {log.project?.title ?? "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Provider sequence and failure details */}
                  <div className="space-y-3">
                    {log.providerTypes.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Provider sequence
                        </span>
                        {log.providerTypes.map((provider, index) => (
                          <span
                            key={`${provider}-${index}`}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                          >
                            {index > 0 ? (
                              <ArrowRight
                                size={11}
                                className="text-muted-foreground"
                                aria-hidden="true"
                              />
                            ) : (
                              <Server
                                size={12}
                                className="text-muted-foreground"
                                aria-hidden="true"
                              />
                            )}
                            {provider}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {log.failureStage ? (
                      <div className="flex items-start gap-2.5 rounded-xl border border-error/20 bg-error/5 p-3.5">
                        <ShieldAlert
                          size={17}
                          className="mt-0.5 shrink-0 text-error"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-error">
                            Failure classification
                          </p>
                          <p className="break-words text-sm font-semibold text-foreground">
                            {log.failureStage}
                            {log.failureKind ? ` / ${log.failureKind}` : ""}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {log.errorCode ? (
                      <div className="rounded-xl border border-error/20 bg-error/5 p-3.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-error">
                          Error details
                        </p>
                        <p className="mt-1 break-words font-mono text-xs font-semibold text-foreground">
                          {log.errorCode}
                        </p>
                        {log.errorMessage ? (
                          <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
                            {log.errorMessage}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Structured diagnostics */}
                  <details className="group overflow-hidden rounded-xl border border-border/70 bg-background/50">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <FileJson size={17} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 space-y-0.5">
                          <span className="block text-sm font-semibold text-foreground">
                            Diagnostic details
                          </span>
                          <span className="block text-xs leading-5 text-muted-foreground">
                            Provider attempts, event timeline, and metadata
                          </span>
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="hidden sm:inline">
                          {Array.isArray(log.attempts)
                            ? log.attempts.length
                            : 0}{" "}
                          attempts
                        </span>
                        <ChevronDown
                          size={17}
                          className="transition-transform duration-200 group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </span>
                    </summary>

                    <div className="space-y-5 border-t border-border/70 p-3 sm:p-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-foreground">
                            Provider attempts
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {Array.isArray(log.attempts)
                              ? log.attempts.length
                              : 0}{" "}
                            records
                          </span>
                        </div>
                        <pre className="max-h-96 max-w-full overflow-auto rounded-xl border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-5 text-foreground [overflow-wrap:normal] sm:p-4">
                          {prettyJson(log.attempts)}
                        </pre>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-foreground">
                          Diagnostic events
                        </h3>
                        <pre className="max-h-96 max-w-full overflow-auto rounded-xl border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-5 text-foreground [overflow-wrap:normal] sm:p-4">
                          {prettyJson(log.events)}
                        </pre>
                      </div>

                      {log.metadata ? (
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-foreground">
                            Additional metadata
                          </h3>
                          <pre className="max-h-64 max-w-full overflow-auto rounded-xl border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-5 text-foreground [overflow-wrap:normal] sm:p-4">
                            {prettyJson(log.metadata)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  </details>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {/* Pagination */}
        {data && data.totalPages > 1 ? (
          <nav
            aria-label="AI logs pagination"
            className="sticky bottom-9 sm:bottom-5 flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Page {data.page} of {data.totalPages}
              </p>
              <p className="text-xs text-muted-foreground">
                {visibleRange
                  ? `Showing ${visibleRange.start}–${visibleRange.end} of ${data.total} executions`
                  : `${data.total} executions`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                className="btn btn-outline min-h-10"
                disabled={isLoading || data.page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ArrowLeft size={15} aria-hidden="true" />
                Previous
              </button>

              <button
                type="button"
                className="btn btn-outline min-h-10"
                disabled={isLoading || data.page >= data.totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
            <div/>
          </nav>
        ) : null}
      </section>
    </main>
  );
}
