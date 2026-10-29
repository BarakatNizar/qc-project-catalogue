
"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownUp,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Cloud,
  Database,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Plus,
  Save,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteAiProviderAction,
  saveAiProviderAction,
  setAiProviderEnabledAction,
  setAiServiceEnabledAction,
} from "@/Interfaces/actions/admin-ai-providers";
import { Dialog, DialogContent } from "./ui/dialog";

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
  return [...providers].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 inline-flex items-start gap-1.5 text-xs leading-5 text-base-content/60">
      <CircleHelp
        className="mt-0.5 size-3.5 shrink-0"
        aria-hidden="true"
      />
      <span>{children}</span>
    </span>
  );
}

export function AdminAiProviderManager({
  initialProviders,
  initialAiEnabled,
}: {
  initialProviders: ProviderItem[];
  initialAiEnabled: boolean;
}) {
  const [providers, setProviders] = useState(() =>
    sortProviders(initialProviders),
  );
  const [aiEnabled, setAiEnabled] = useState(initialAiEnabled);
  const [draft, setDraft] = useState<ProviderDraft | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const canCreate = providers.length < 4;
  const activeCount = useMemo(
    () => providers.filter((provider) => provider.enabled).length,
    [providers],
  );

  function showError(error: unknown) {
    setIsError(true);
    setMessage(getErrorMessage(error));
  }

  function beginCreate() {
    setDraft({ ...EMPTY_DRAFT, sortOrder: providers.length });
    setMessage(null);
    setIsError(false);
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
    setIsError(false);
  }

  function updateDraft<K extends keyof ProviderDraft>(
    key: K,
    value: ProviderDraft[K],
  ) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || pending) return;

    setPending(true);
    setMessage(null);

    try {
      const result = await saveAiProviderAction({ ...draft });

      if ("error" in result) {
        setIsError(true);
        setMessage(result.error);
        return;
      }

      setProviders(sortProviders(result.data as ProviderItem[]));
      setDraft(null);
      setIsError(false);
      setMessage("Provider configuration saved.");
    } catch (error) {
      showError(error);
    } finally {
      setPending(false);
    }
  }

  async function toggleProvider(provider: ProviderItem) {
    if (pending) return;

    setPending(true);
    setMessage(null);

    try {
      const result = await setAiProviderEnabledAction({
        id: provider.id,
        enabled: !provider.enabled,
      });

      if ("error" in result) {
        setIsError(true);
        setMessage(result.error);
        return;
      }

      setProviders(sortProviders(result.data as ProviderItem[]));
      setIsError(false);
      setMessage(
        `${provider.name} ${provider.enabled ? "disabled" : "enabled"}.`,
      );
    } catch (error) {
      showError(error);
    } finally {
      setPending(false);
    }
  }

  async function removeProvider(provider: ProviderItem) {
    if (pending) return;

    const confirmed = window.confirm(
      `Delete provider "${provider.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setPending(true);
    setMessage(null);

    try {
      const result = await deleteAiProviderAction({ id: provider.id });

      if ("error" in result) {
        setIsError(true);
        setMessage(result.error);
        return;
      }

      setProviders(sortProviders(result.data as ProviderItem[]));

      if (draft?.id === provider.id) {
        setDraft(null);
      }

      setIsError(false);
      setMessage("Provider deleted.");
    } catch (error) {
      showError(error);
    } finally {
      setPending(false);
    }
  }

  async function toggleService() {
    if (pending) return;

    const nextEnabled = !aiEnabled;

    setPending(true);
    setMessage(null);

    try {
      const result = await setAiServiceEnabledAction({
        enabled: nextEnabled,
      });

      if ("error" in result) {
        setIsError(true);
        setMessage(result.error);
        return;
      }

      setAiEnabled(result.data.enabled);
      setIsError(false);
      setMessage(`AI service ${nextEnabled ? "enabled" : "disabled"}.`);
    } catch (error) {
      showError(error);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Global service control */}
      <section
        aria-labelledby="ai-service-heading"
        className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm"
      >
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${aiEnabled
                  ? "bg-success/10 text-success"
                  : "bg-base-200 text-base-content/60"
                }`}
            >
              {aiEnabled ? (
                <Sparkles className="size-5" aria-hidden="true" />
              ) : (
                <Activity className="size-5" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="ai-service-heading"
                  className="text-lg font-semibold tracking-tight sm:text-xl"
                >
                  AI service
                </h2>
                <span
                  className={`badge badge-sm ${aiEnabled
                      ? "badge-success badge-outline"
                      : "badge-ghost"
                    }`}
                >
                  <span
                    className={`mr-1.5 size-1.5 rounded-full ${aiEnabled ? "bg-success" : "bg-base-content/40"
                      }`}
                    aria-hidden="true"
                  />
                  {aiEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-base-content/70">
                {aiEnabled
                  ? "AI features are available to authorized users, subject to provider availability and the configured execution sequence."
                  : "AI features are globally disabled. Enabling individual providers will not make AI features available until this service is enabled."}
              </p>

              <p className="flex items-start gap-2 text-xs leading-5 text-base-content/60">
                <ArrowDownUp
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                Enabled providers are attempted in configured order when an
                earlier provider fails.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`btn w-full shrink-0 sm:w-fit ${aiEnabled ? "btn-outline btn-error" : "btn-primary"
              }`}
            disabled={pending}
            onClick={toggleService}
          >
            {pending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : aiEnabled ? (
              <X className="size-4" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            {aiEnabled ? "Disable AI service" : "Enable AI service"}
          </button>
        </div>
      </section>

      {/* Action feedback */}
      {message ? (
        <div
          className={`alert items-start ${isError ? "alert-error" : "alert-success"
            }`}
          role={isError ? "alert" : "status"}
          aria-live={isError ? "assertive" : "polite"}
        >
          {isError ? (
            <AlertCircle
              className="mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="min-w-0 break-words">{message}</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs ml-auto shrink-0"
            aria-label="Dismiss message"
            onClick={() => setMessage(null)}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {/* Provider inventory */}
      <section
        aria-labelledby="configured-providers-heading"
        className="min-w-0 rounded-3xl border border-base-300 bg-base-100 shadow-sm"
      >
        <div className="space-y-5 p-4 sm:p-6 lg:p-7">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="configured-providers-heading"
                  className="text-lg font-semibold tracking-tight sm:text-xl"
                >
                  Configured providers
                </h2>
                <span className="badge badge-ghost">
                  {providers.length} of 4
                </span>
              </div>
              <p className="text-sm leading-6 text-base-content/70">
                Review connection settings, manage provider availability, and
                maintain the fallback sequence.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary w-full shrink-0 sm:w-fit"
              disabled={!canCreate || pending}
              onClick={beginCreate}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add provider
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-base-300/80 bg-base-200/40 p-3.5">
              <div className="flex items-center gap-2 text-xs text-base-content/60">
                <Database className="size-4" aria-hidden="true" />
                Configured
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {providers.length}
                <span className="ml-1 text-sm font-normal text-base-content/50">
                  / 4
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-base-300/80 bg-base-200/40 p-3.5">
              <div className="flex items-center gap-2 text-xs text-base-content/60">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Enabled providers
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-base-300/80 bg-base-200/40 p-3.5">
              <div className="flex items-center gap-2 text-xs text-base-content/60">
                <Activity className="size-4" aria-hidden="true" />
                Service availability
              </div>
              <p
                className={`mt-2 text-sm font-semibold ${aiEnabled ? "text-success" : "text-base-content/60"
                  }`}
              >
                {aiEnabled ? "Globally enabled" : "Globally disabled"}
              </p>
            </div>
          </div>

          {providers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base-300 px-4 py-10 text-center sm:px-8">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-base-200 text-base-content/60">
                <Server className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold">No providers configured</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-base-content/65">
                Add a provider to configure an AI connection. Check its
                endpoint, model identifier, and credentials before enabling
                AI features.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-5"
                disabled={!canCreate || pending}
                onClick={beginCreate}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add your first provider
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <article
                  key={provider.id}
                  className={`min-w-0 overflow-hidden rounded-2xl border bg-base-100 transition-colors ${provider.enabled
                      ? "border-base-300"
                      : "border-base-300/70 bg-base-200/20"
                    }`}
                >
                  <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${provider.provider === "OPENROUTER"
                              ? "bg-primary/10 text-primary"
                              : "bg-base-200 text-base-content/75"
                            }`}
                        >
                          {provider.provider === "OPENROUTER" ? (
                            <Cloud className="size-5" aria-hidden="true" />
                          ) : (
                            <Server className="size-5" aria-hidden="true" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-neutral badge-sm">
                              Priority {provider.sortOrder + 1}
                            </span>
                            <span
                              className={`badge badge-sm ${provider.enabled
                                  ? "badge-success badge-outline"
                                  : "badge-ghost"
                                }`}
                            >
                              {provider.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>

                          <h3 className="break-words text-base font-semibold sm:text-lg">
                            {provider.name}
                          </h3>

                          <p className="text-xs text-base-content/60 sm:text-sm">
                            {provider.provider === "OPENROUTER"
                              ? "OpenRouter · Hosted provider"
                              : "Local · Self-hosted endpoint"}
                          </p>
                        </div>
                      </div>

                      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="min-w-0 rounded-xl bg-base-200/50 p-3">
                          <p className="text-xs font-medium text-base-content/60">
                            Base URL
                          </p>
                          <p className="mt-1 break-all text-sm leading-5">
                            {provider.baseUrl}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-xl bg-base-200/50 p-3">
                          <p className="text-xs font-medium text-base-content/60">
                            Model identifier
                          </p>
                          <p className="mt-1 break-words text-sm leading-5">
                            {provider.model}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
                        <div className="inline-flex items-center gap-2 text-base-content/70">
                          <Clock3
                            className="size-4 shrink-0 text-base-content/50"
                            aria-hidden="true"
                          />
                          <span>
                            <span className="font-medium text-base-content">
                              Timeout
                            </span>{" "}
                            {provider.timeoutMs.toLocaleString()} ms
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-2 text-base-content/70">
                          {provider.hasApiKey ? (
                            <ShieldCheck
                              className="size-4 shrink-0 text-success"
                              aria-hidden="true"
                            />
                          ) : (
                            <KeyRound
                              className="size-4 shrink-0 text-base-content/50"
                              aria-hidden="true"
                            />
                          )}
                          <span>
                            <span className="font-medium text-base-content">
                              API key
                            </span>{" "}
                            {provider.hasApiKey
                              ? "Saved (encrypted)"
                              : "Not set"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap gap-2 border-t border-base-300/70 pt-4 xl:w-auto xl:shrink-0 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline flex-1 sm:flex-none"
                        disabled={pending}
                        onClick={() => beginEdit(provider)}
                      >
                        <Settings2 className="size-4" aria-hidden="true" />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline flex-1 sm:flex-none"
                        disabled={pending}
                        onClick={() => toggleProvider(provider)}
                      >
                        {provider.enabled ? (
                          <X className="size-4" aria-hidden="true" />
                        ) : (
                          <Check className="size-4" aria-hidden="true" />
                        )}
                        {provider.enabled ? "Disable" : "Enable"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error flex-1 sm:flex-none"
                        disabled={pending}
                        onClick={() => removeProvider(provider)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-base-300/70 bg-base-200/30 p-3.5 text-xs leading-5 text-base-content/65">
            <EyeOff
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              <span className="font-semibold text-base-content/80">
                Credential privacy.
              </span>{" "}
              Saved API keys are not displayed. When editing a provider, leave
              the key field empty to keep the existing key unchanged.
            </p>
          </div>
        </div>
      </section>

      {/* Create / edit form */}
      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-primary/30 bg-base-100">
          {draft ? (
            <section
              aria-labelledby="provider-editor-heading"
              className="min-w-0 overflow-hidden bg-base-100"
            >
              <div className="border-b border-base-300 bg-primary/5 p-4 sm:p-6 lg:p-7">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Settings2 className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="provider-editor-heading"
                        className="text-lg font-semibold tracking-tight sm:text-xl"
                      >
                        {draft.id ? "Edit provider" : "Add provider"}
                      </h2>
                      <p className="mt-1 text-sm leading-5 text-base-content/65">
                        Configure the connection and execution settings for this
                        provider.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm shrink-0"
                    disabled={pending}
                    onClick={() => setDraft(null)}
                  >
                    <X className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-7">
                <form className="space-y-7" onSubmit={saveProvider}>
                  <fieldset disabled={pending} className="min-w-0 space-y-7">
                    <legend className="sr-only">Provider configuration</legend>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Connection details</h3>
                        <p className="mt-1 text-sm text-base-content/65">
                          Identify the provider and the API endpoint used to reach
                          it.
                        </p>
                      </div>

                      <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                        <label className="form-control min-w-0 gap-1">
                          <span className="label-text font-medium">
                            Display name
                          </span>
                          <input
                            className="input input-bordered w-full"
                            required
                            maxLength={80}
                            value={draft.name}
                            onChange={(event) =>
                              updateDraft("name", event.target.value)
                            }
                            placeholder="Local Qwen"
                          />
                          <FieldHint>
                            A recognizable name shown in the administration
                            interface.
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1">
                          <span className="label-text font-medium">
                            Provider type
                          </span>
                          <select
                            className="select select-bordered w-full"
                            value={draft.provider}
                            onChange={(event) => {
                              const provider = event.target.value as ProviderType;
                              updateDraft("provider", provider);

                              if (
                                provider === "OPENROUTER" &&
                                draft.baseUrl.startsWith("http://")
                              ) {
                                updateDraft(
                                  "baseUrl",
                                  "https://openrouter.ai/api/v1",
                                );
                              }
                            }}
                          >
                            <option value="LOCAL">Local</option>
                            <option value="OPENROUTER">OpenRouter</option>
                          </select>
                          <FieldHint>
                            Choose a local endpoint or the OpenRouter provider.
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1">
                          <span className="label-text font-medium">
                            Execution order
                          </span>
                          <select
                            className="select select-bordered w-full"
                            value={draft.sortOrder}
                            onChange={(event) =>
                              updateDraft("sortOrder", Number(event.target.value))
                            }
                          >
                            {Array.from(
                              {
                                length: Math.min(
                                  4,
                                  providers.length + (draft.id ? 0 : 1),
                                ),
                              },
                              (_, position) => (
                                <option key={position} value={position}>
                                  Provider {position + 1}
                                </option>
                              ),
                            )}
                          </select>
                          <FieldHint>
                            Earlier positions are tried before later enabled
                            providers when a provider fails.
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1 sm:col-span-2 xl:col-span-1">
                          <span className="label-text font-medium">Base URL</span>
                          <input
                            className="input input-bordered w-full"
                            type="url"
                            required
                            maxLength={500}
                            value={draft.baseUrl}
                            onChange={(event) =>
                              updateDraft("baseUrl", event.target.value)
                            }
                            placeholder={
                              draft.provider === "OPENROUTER"
                                ? "https://openrouter.ai/api/v1"
                                : "http://127.0.0.1:1234/v1"
                            }
                          />
                          <FieldHint>
                            The API-compatible endpoint used to contact this
                            provider.
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1">
                          <span className="label-text font-medium">
                            Model identifier
                          </span>
                          <input
                            className="input input-bordered w-full"
                            required
                            maxLength={180}
                            value={draft.model}
                            onChange={(event) =>
                              updateDraft("model", event.target.value)
                            }
                            placeholder="provider/model-name"
                          />
                          <FieldHint>
                            The exact model identifier expected by the endpoint.
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1">
                          <span className="label-text font-medium">
                            Timeout (milliseconds)
                          </span>
                          <input
                            className="input input-bordered w-full"
                            type="number"
                            min={1000}
                            max={1800000}
                            step={1000}
                            required
                            value={draft.timeoutMs}
                            onChange={(event) =>
                              updateDraft("timeoutMs", Number(event.target.value))
                            }
                          />
                          <FieldHint>
                            Maximum wait time configured for a provider request.
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1 sm:col-span-2 xl:col-span-1">
                          <span className="label-text font-medium">
                            API key{" "}
                            {draft.id
                              ? "(optional update)"
                              : draft.provider === "OPENROUTER"
                                ? "(required)"
                                : "(optional for local)"}
                          </span>
                          <input
                            className="input input-bordered w-full"
                            type="password"
                            autoComplete="new-password"
                            maxLength={2000}
                            value={draft.apiKey}
                            onChange={(event) =>
                              updateDraft("apiKey", event.target.value)
                            }
                            placeholder={
                              draft.id &&
                                providers.find(
                                  (provider) => provider.id === draft.id,
                                )?.hasApiKey
                                ? "Saved key is hidden"
                                : "Enter API key"
                            }
                          />
                          <FieldHint>
                            {draft.id
                              ? "Leave empty to keep the existing saved key unchanged."
                              : draft.provider === "OPENROUTER"
                                ? "Enter the key required to authenticate with OpenRouter."
                                : "Only enter a key if your local endpoint requires one."}
                          </FieldHint>
                        </label>
                      </div>
                    </div>

                    <div className="divider my-0" />

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Availability and security</h3>
                        <p className="mt-1 text-sm text-base-content/65">
                          Decide whether this provider can participate in the
                          execution sequence.
                        </p>
                      </div>

                      {draft.id && draft.provider === "LOCAL" ? (
                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-base-300 p-4">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm mt-0.5"
                            checked={draft.clearApiKey}
                            onChange={(event) =>
                              updateDraft("clearApiKey", event.target.checked)
                            }
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">
                              Clear the currently saved API key
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-base-content/60">
                              Available for local providers only. Use this only if
                              the saved key should be removed.
                            </span>
                          </span>
                        </label>
                      ) : null}

                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-base-300 p-4">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm mt-0.5"
                          checked={draft.enabled}
                          onChange={(event) =>
                            updateDraft("enabled", event.target.checked)
                          }
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            Enable this provider
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-base-content/60">
                            Enabled providers are eligible for the configured
                            execution sequence. The global AI service must also be
                            enabled for AI features to be available.
                          </span>
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="btn btn-ghost w-full sm:w-auto"
                      disabled={pending}
                      onClick={() => setDraft(null)}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary w-full sm:w-auto"
                      disabled={pending}
                    >
                      {pending ? (
                        <LoaderCircle
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Save className="size-4" aria-hidden="true" />
                      )}
                      {pending ? "Saving…" : "Save provider"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
