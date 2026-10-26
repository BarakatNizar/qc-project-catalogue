"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  deleteAiProviderAction,
  saveAiProviderAction,
  setAiProviderEnabledAction,
  setAiServiceEnabledAction,
} from "@/Interfaces/actions/admin-ai-providers";

type ProviderType = "OPENROUTER" | "LOCAL";

type ProviderItem = {
  id: string;
  name: string;
  provider: ProviderType;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  enabled: boolean;
  sortOrder: number;
  hasApiKey: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProviderDraft = {
  id?: string;
  name: string;
  provider: ProviderType;
  baseUrl: string;
  apiKey: string;
  clearApiKey: boolean;
  model: string;
  timeoutMs: number;
  enabled: boolean;
  sortOrder: number;
};

const EMPTY_DRAFT: ProviderDraft = {
  name: "",
  provider: "LOCAL",
  baseUrl: "http://127.0.0.1:1234/v1",
  apiKey: "",
  clearApiKey: false,
  model: "",
  timeoutMs: 45000,
  enabled: true,
  sortOrder: 0,
};

function sortProviders(providers: ProviderItem[]): ProviderItem[] {
  return [...providers].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function AdminAiProviderManager({
  initialProviders,
  initialAiEnabled,
}: {
  initialProviders: ProviderItem[];
  initialAiEnabled: boolean;
}) {
  const [providers, setProviders] = useState(() => sortProviders(initialProviders));
  const [aiEnabled, setAiEnabled] = useState(initialAiEnabled);
  const [draft, setDraft] = useState<ProviderDraft | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const canCreate = providers.length < 4;
  const activeCount = useMemo(() => providers.filter((provider) => provider.enabled).length, [providers]);

  function beginCreate() {
    setDraft({ ...EMPTY_DRAFT, sortOrder: providers.length });
    setMessage(null);
  }

  function beginEdit(provider: ProviderItem) {
    setDraft({
      id: provider.id,
      name: provider.name,
      provider: provider.provider,
      baseUrl: provider.baseUrl,
      apiKey: "",
      clearApiKey: false,
      model: provider.model,
      timeoutMs: provider.timeoutMs,
      enabled: provider.enabled,
      sortOrder: provider.sortOrder,
    });
    setMessage(null);
  }

  function updateDraft<K extends keyof ProviderDraft>(key: K, value: ProviderDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    setPending(true);
    setMessage(null);
    console.log("DRAFT: ", draft)
    const result = await saveAiProviderAction({ ...draft });
    setPending(false);

    if ("error" in result) {
      setIsError(true);
      setMessage(result.error);
      return;
    }

    setProviders(sortProviders(result.data as ProviderItem[]));
    setDraft(null);
    setIsError(false);
    setMessage("Provider configuration saved.");
  }

  async function toggleProvider(provider: ProviderItem) {
    setPending(true);
    setMessage(null);
    const result = await setAiProviderEnabledAction({ id: provider.id, enabled: !provider.enabled });
    setPending(false);

    if ("error" in result) {
      setIsError(true);
      setMessage(result.error);
      return;
    }

    setProviders(sortProviders(result.data as ProviderItem[]));
    setIsError(false);
    setMessage(`${provider.name} ${provider.enabled ? "disabled" : "enabled"}.`);
  }

  async function removeProvider(provider: ProviderItem) {
    if (!window.confirm(`Delete provider "${provider.name}"? This cannot be undone.`)) return;
    setPending(true);
    setMessage(null);
    const result = await deleteAiProviderAction({ id: provider.id });
    setPending(false);

    if ("error" in result) {
      setIsError(true);
      setMessage(result.error);
      return;
    }

    setProviders(sortProviders(result.data as ProviderItem[]));
    if (draft?.id === provider.id) setDraft(null);
    setIsError(false);
    setMessage("Provider deleted.");
  }

  async function toggleService() {
    const nextEnabled = !aiEnabled;
    setPending(true);
    setMessage(null);
    const result = await setAiServiceEnabledAction({ enabled: nextEnabled });
    setPending(false);

    if ("error" in result) {
      setIsError(true);
      setMessage(result.error);
      return;
    }

    setAiEnabled(result.data.enabled);
    setIsError(false);
    setMessage(`AI service ${nextEnabled ? "enabled" : "disabled"}.`);
  }

  return (
    <div className="space-y-6">
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="card-title">AI service</h2>
            <p className="text-sm text-base-content/70">
              {aiEnabled ? "AI features are available to authorized users." : "AI features are disabled globally."}
              {" "}Providers are tried by order when an earlier provider fails.
            </p>
          </div>
          <button type="button" className={`btn ${aiEnabled ? "btn-outline btn-error" : "btn-primary"}`} disabled={pending} onClick={toggleService}>
            {aiEnabled ? "Disable AI service" : "Enable AI service"}
          </button>
        </div>
      </section>

      {message ? <div className={`alert ${isError ? "alert-error" : "alert-success"}`} role="status">{message}</div> : null}

      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <h2 className="card-title">Configured providers ({providers.length}/4)</h2>
              <p className="text-sm text-base-content/70">{activeCount} enabled provider(s). Order determines the attempt sequence.</p>
            </div>
            <button type="button" className="btn btn-primary" disabled={!canCreate || pending} onClick={beginCreate}>
              Add provider
            </button>
          </div>

          {providers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base-300 p-8 text-center">
              <h3 className="font-semibold">No providers configured</h3>
              <p className="mt-1 text-sm text-base-content/70">Add at least one enabled provider before requesting AI features.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <article key={provider.id} className="rounded-xl border border-base-300 p-4">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge badge-neutral">#{provider.sortOrder + 1}</span>
                        <h3 className="font-semibold">{provider.name}</h3>
                        <span className="badge badge-outline">{provider.provider === "OPENROUTER" ? "OpenRouter" : "Local"}</span>
                        <span className={`badge ${provider.enabled ? "badge-success badge-outline" : "badge-ghost"}`}>{provider.enabled ? "Enabled" : "Disabled"}</span>
                      </div>
                      <p className="break-all text-sm text-base-content/70">{provider.baseUrl}</p>
                      <p className="text-sm"><span className="font-medium">Model:</span> {provider.model} <span className="mx-1 text-base-content/40">•</span> <span className="font-medium">Timeout:</span> {provider.timeoutMs.toLocaleString()} ms <span className="mx-1 text-base-content/40">•</span> <span className="font-medium">API key:</span> {provider.hasApiKey ? "Saved (encrypted)" : "Not set"}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button type="button" className="btn btn-sm btn-outline" disabled={pending} onClick={() => beginEdit(provider)}>Edit</button>
                      <button type="button" className="btn btn-sm btn-outline" disabled={pending} onClick={() => toggleProvider(provider)}>{provider.enabled ? "Disable" : "Enable"}</button>
                      <button type="button" className="btn btn-sm btn-outline btn-error" disabled={pending} onClick={() => removeProvider(provider)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="text-xs text-base-content/60">For privacy, saved API keys are never sent to the browser. Leave the key field empty to keep the saved key unchanged.</p>
        </div>
      </section>

      {draft ? (
        <section className="card border border-primary/40 bg-base-100 shadow-sm">
          <div className="card-body gap-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="card-title">{draft.id ? "Edit provider" : "Add provider"}</h2>
              <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setDraft(null)}>Cancel</button>
            </div>

            <form className="space-y-5" onSubmit={saveProvider}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <label className="form-control gap-1">
                  <span className="label-text font-medium">Display name</span>
                  <input className="input input-bordered" required maxLength={80} value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Local Qwen" />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Provider type</span>
                  <select className="select select-bordered" value={draft.provider} onChange={(event) => {
                    const provider = event.target.value as ProviderType;
                    updateDraft("provider", provider);
                    if (provider === "OPENROUTER" && draft.baseUrl.startsWith("http://")) updateDraft("baseUrl", "https://openrouter.ai/api/v1");
                  }}>
                    <option value="LOCAL">Local</option>
                    <option value="OPENROUTER">OpenRouter</option>
                  </select>
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Execution order</span>
                  <select className="select select-bordered" value={draft.sortOrder} onChange={(event) => updateDraft("sortOrder", Number(event.target.value))}>
                    {Array.from({ length: Math.min(4, providers.length + (draft.id ? 0 : 1)) }, (_, position) => (
                      <option key={position} value={position}>Provider {position + 1}</option>
                    ))}
                  </select>
                </label>

                <label className="form-control gap-1 sm:col-span-2 xl:col-span-1">
                  <span className="label-text font-medium">Base URL</span>
                  <input className="input input-bordered" type="url" required maxLength={500} value={draft.baseUrl} onChange={(event) => updateDraft("baseUrl", event.target.value)} placeholder={draft.provider === "OPENROUTER" ? "https://openrouter.ai/api/v1" : "http://127.0.0.1:1234/v1"} />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Model</span>
                  <input className="input input-bordered" required maxLength={180} value={draft.model} onChange={(event) => updateDraft("model", event.target.value)} placeholder="provider/model-name" />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Timeout (milliseconds)</span>
                  <input className="input input-bordered" type="number" min={1000} max={1800000} step={1000} required value={draft.timeoutMs} onChange={(event) => updateDraft("timeoutMs", Number(event.target.value))} />
                </label>

                <label className="form-control gap-1 sm:col-span-2 xl:col-span-1">
                  <span className="label-text font-medium">API key {draft.id ? "(optional update)" : draft.provider === "OPENROUTER" ? "(required)" : "(optional for local)"}</span>
                  <input className="input input-bordered" type="password" autoComplete="new-password" maxLength={2000} value={draft.apiKey} onChange={(event) => updateDraft("apiKey", event.target.value)} placeholder={draft.id && providers.find((provider) => provider.id === draft.id)?.hasApiKey ? "Saved key is hidden" : "Enter API key"} />
                </label>
              </div>

              {draft.id && draft.provider === "LOCAL" ? (
                <label className="label cursor-pointer justify-start gap-3">
                  <input type="checkbox" className="checkbox checkbox-sm" checked={draft.clearApiKey} onChange={(event) => updateDraft("clearApiKey", event.target.checked)} />
                  <span className="label-text">Clear the currently saved API key (for local providers only)</span>
                </label>
              ) : null}

              <label className="label cursor-pointer justify-start gap-3">
                <input type="checkbox" className="checkbox checkbox-sm" checked={draft.enabled} onChange={(event) => updateDraft("enabled", event.target.checked)} />
                <span className="label-text">Enable this provider for the execution sequence</span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save provider"}</button>
                <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => setDraft(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
