"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getAiLogsAction } from "@/Interfaces/getters/ai-logs.getters"; 
import { type AiLogsFilters } from "@/shared/validation/ai-logs";
import { notify } from "@/components/notificationToaster";

function badgeClass(value: string): string {
  if (value === "FAILED" || value === "ERROR") return "badge badge-error badge-outline";
  if (value === "RUNNING" || value === "WARN") return "badge badge-warning badge-outline";
  if (value === "SUCCEEDED") return "badge badge-success badge-outline";
  return "badge badge-ghost";
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "medium" }).format(date);
}

function prettyJson(value: unknown): string { 
  return JSON.stringify(value ?? [], null, 2); 
}

export default function AdminAiLogsPage() {
  // State for each individual input filter
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [operation, setOperation] = useState<AiLogsFilters['operation']>("");
  const [status, setStatus] = useState<AiLogsFilters['status']>("");
  const [level, setLevel] = useState<AiLogsFilters['level']>("");
  const [provider, setProvider] = useState<AiLogsFilters['provider']>("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Data, error, and loading states
  const [data, setData] = useState<Awaited<ReturnType<typeof getAiLogsAction>>["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async (targetPage = page) => {
    setIsLoading(true);

    const filters: AiLogsFilters = {
      from,
      to,
      operation,
      status,
      level,
      provider,
      query,
      page: targetPage,
    };

    const result = await getAiLogsAction(filters);
    
    if ("error" in result) {
      notify.error("Error", result.error)
      setData(null);
    } else {
      notify.success("Logs Loaded")
      setData(result.data);
    }
    setIsLoading(false);
  };

  // Fetch logs on initial mount and whenever page changes
  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    if (page === 1) {
      fetchLogs(1);
    } else {
      setPage(1); // Setting page to 1 will automatically trigger useEffect to fetch
    }
  };

  const handleClearFilters = (e: React.MouseEvent) => {
    e.preventDefault();
    setFrom("");
    setTo("");
    setOperation("");
    setStatus("");
    setLevel("");
    setProvider("");
    setQuery("");
    setPage(1);
    
    // Fetch immediately with cleared filters
    setTimeout(() => {
      fetchLogs(1);
    }, 0);
  };

  return (
    <main className="mx-auto max-w-screen-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 border-b border-base-300 pb-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Administration / AI</p>
          <h1 className="text-3xl font-semibold tracking-tight">AI execution logs</h1>
          <p className="max-w-3xl text-sm text-base-content/70">One database row represents one AI operation. Its provider attempts and diagnostic events are stored in that row as structured JSON. Times and date filters use UTC.</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-ghost btn-sm" href="/admin/ai/providers">Provider configuration</Link>
          <Link className="btn btn-ghost btn-sm" href="/admin/ai">AI settings</Link>
        </div>
      </header>

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="card-title text-lg">Filter executions</h2>
            <button onClick={handleClearFilters} className="link link-hover text-sm bg-transparent border-none cursor-pointer">Clear filters</button>
          </div>
          <form onSubmit={handleApplyFilters} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="form-control gap-1">
                <span className="label-text font-medium">From (UTC)</span>
                <input className="input input-bordered" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="form-control gap-1">
                <span className="label-text font-medium">To (UTC)</span>
                <input className="input input-bordered" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
              <label className="form-control gap-1">
                <span className="label-text font-medium">Operation</span>
                <select className="select select-bordered" value={operation} onChange={(e) => setOperation(e.target.value as AiLogsFilters['operation'])}>
                  <option value="">All operations</option>
                  <option value="SUGGESTIONS">Suggestions</option>
                  <option value="PROJECT_EXTRACTION">Project extraction</option>
                </select>
              </label>
              <label className="form-control gap-1">
                <span className="label-text font-medium">Status</span>
                <select className="select select-bordered" value={status} onChange={(e) => setStatus(e.target.value as AiLogsFilters['status'])}>
                  <option value="">All statuses</option>
                  <option value="RUNNING">Running</option>
                  <option value="SUCCEEDED">Succeeded</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>
              <label className="form-control gap-1">
                <span className="label-text font-medium">Severity</span>
                <select className="select select-bordered" value={level} onChange={(e) => setLevel(e.target.value as AiLogsFilters['level'])}>
                  <option value="">All levels</option>
                  <option value="INFO">Info</option>
                  <option value="WARN">Warning</option>
                  <option value="ERROR">Error</option>
                </select>
              </label>
              <label className="form-control gap-1">
                <span className="label-text font-medium">Provider used or attempted</span>
                <select className="select select-bordered" value={provider} onChange={(e) => setProvider(e.target.value as AiLogsFilters['provider'])}>
                  <option value="">All providers</option>
                  <option value="OPENROUTER">OpenRouter</option>
                  <option value="LOCAL">Local</option>
                </select>
              </label>
              <label className="form-control gap-1 sm:col-span-2">
                <span className="label-text font-medium">Search</span>
                <input className="input input-bordered" type="search" maxLength={100} placeholder="Trace ID, error code, provider name, or model" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? "Applying..." : "Apply filters"}
              </button>
              <p className="text-xs text-base-content/60">Newest executions first · 25 per page.</p>
            </div>
          </form>
        </div>
      </section>


      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h2 className="text-xl font-semibold">Executions</h2>
          {data ? <p className="text-sm text-base-content/70">{data.total === 0 ? "No matching executions" : `Showing ${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} of ${data.total}`}</p> : null}
        </div>

        {isLoading && !data ? (
          <div className="rounded-xl border border-dashed border-base-300 p-10 text-center text-sm text-base-content/70">Loading executions...</div>
        ) : data?.logs.length ? (
          data.logs.map((log) => (
            <article key={log.id} className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body gap-4">
                <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={badgeClass(log.status)}>{log.status}</span>
                      <span className={badgeClass(log.level)}>{log.level}</span>
                      <span className="badge badge-outline">{log.operation === "PROJECT_EXTRACTION" ? "Project extraction" : "Suggestions"}</span>
                    </div>
                    <p className="break-all font-mono text-xs text-base-content/70">Trace: {log.traceId}</p>
                    <p className="text-sm">
                      <span className="font-medium">Started:</span> {formatDate(log.startedAt)} 
                      <span className="mx-1 text-base-content/40">·</span>
                      <span className="font-medium">Duration:</span> {log.durationMs === null ? "In progress" : `${log.durationMs} ms`}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">User:</span> {log.triggeredByUser?.name ?? "Deleted or unavailable"}
                      <span className="mx-1 text-base-content/40">·</span>
                      <span className="font-medium">Project:</span> {log.project?.title ?? "N/A"}
                    </p>
                  </div>
                  <div className="min-w-0 space-y-1 xl:max-w-md xl:text-right">
                    <p className="text-sm font-semibold">{log.finalProviderName || (log.providerTypes.length ? log.providerTypes.join(" → ") : "No provider attempted")}</p>
                    <p className="break-all text-sm text-base-content/70">{log.finalModel ?? "No successful provider"}</p>
                    {log.errorCode ? <p className="text-sm font-medium text-error">{log.errorCode}: {log.errorMessage}</p> : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {log.providerTypes.map((provider) => <span key={provider} className="badge badge-outline">{provider}</span>)}
                  {log.failureStage ? <span className="badge badge-error badge-outline">{log.failureStage} / {log.failureKind}</span> : null}
                </div>

                <details className="rounded-lg border border-base-300">
                  <summary className="cursor-pointer px-4 py-3 font-medium">Provider attempts ({Array.isArray(log.attempts) ? log.attempts.length : 0}) and diagnostic timeline</summary>
                  <div className="space-y-4 border-t border-base-300 p-4">
                    <div><h3 className="mb-2 text-sm font-semibold">Attempts</h3><pre className="max-h-96 overflow-auto rounded-lg bg-base-200 p-3 text-xs leading-relaxed">{prettyJson(log.attempts)}</pre></div>
                    <div><h3 className="mb-2 text-sm font-semibold">Events</h3><pre className="max-h-96 overflow-auto rounded-lg bg-base-200 p-3 text-xs leading-relaxed">{prettyJson(log.events)}</pre></div>
                    {log.metadata ? <div><h3 className="mb-2 text-sm font-semibold">Additional metadata</h3><pre className="max-h-64 overflow-auto rounded-lg bg-base-200 p-3 text-xs">{prettyJson(log.metadata)}</pre></div> : null}
                  </div>
                </details>
              </div>
            </article>
          ))
        ) : data ? (
          <div className="rounded-xl border border-dashed border-base-300 p-10 text-center text-sm text-base-content/70">No AI executions match these filters.</div>
        ) : null}

        {data && data.totalPages > 1 ? (
          <nav className="flex items-center justify-between gap-3" aria-label="AI logs pagination">
            <p className="text-sm text-base-content/70">Page {data.page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button 
                type="button"
                className={`btn btn-sm btn-outline ${data.page <= 1 ? "btn-disabled" : ""}`}
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </button>
              <button 
                type="button"
                className={`btn btn-sm btn-outline ${data.page >= data.totalPages ? "btn-disabled" : ""}`}
                disabled={data.page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, data.totalPages))}
              >
                Next
              </button>
            </div>
          </nav>
        ) : null}
      </section>
    </main>
  );
}