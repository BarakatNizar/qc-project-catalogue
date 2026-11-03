
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowDownUp,
  Check,
  CheckCircle2,
  CircleHelp,
  Database,
  EyeOff,
  Globe,
  Languages,
  LoaderCircle,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import {
  createTranslationProviderAction,
  deleteTranslationProviderAction,
  setTranslationProviderEnabledAction,
  setTranslationServiceEnabledAction,
  updateTranslationProviderAction,
} from "@/Interfaces/actions/admin-translation.actions";
import { Dialog, DialogContent } from "./ui/dialog";
import { notify } from "./notificationToaster";
import { t, type Locale } from "@/shared/i18n/dictionary";

type ProviderType =
  | "google"
  | "microsoft"
  | "deepl"
  | "libretranslate"
  | "lingva"
  | "ai_openrouter"
  | "ai_local";

type ProviderItem = {
  id: string;
  name: string;
  providerType: ProviderType;
  baseUrl: string;
  hasApiKey: boolean;
  region: string | null;
  model: string | null;
  timeoutMs: number;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type ProviderDraft = {
  id?: string;
  name: string;
  providerType: ProviderType;
  baseUrl: string;
  apiKey: string;
  clearApiKey: boolean;
  region: string;
  model: string;
  timeoutMs: number;
  enabled: boolean;
  sortOrder: number;
};

const EMPTY_DRAFT: ProviderDraft = {
  name: "",
  providerType: "google",
  baseUrl: "",
  apiKey: "",
  clearApiKey: false,
  region: "",
  model: "",
  timeoutMs: 30000,
  enabled: true,
  sortOrder: 0,
};

function sortProviders(providers: ProviderItem[]): ProviderItem[] {
  return [...providers].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}

function getErrorMessage(error: unknown, locale: Locale): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return t(locale, "unexpectedErrorTryAgain");
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 inline-flex items-start gap-1.5 text-[16px] leading-7 text-base-content/90 font-semibold">
      <CircleHelp
        className="mt-0.5 size-3.5 shrink-0"
        aria-hidden="true"
      />
      <span>{children}</span>
    </span>
  );
}

export function AdminTranslationProviderManager({
  initialProviders,
  initialServiceEnabled,
}: {
  initialProviders: ProviderItem[];
  initialServiceEnabled: boolean;
}) {
  const router = useRouter();

  const [locale, setLocale] = useState<Locale>("en");
  const [providers, setProviders] = useState(() =>
    sortProviders(initialProviders),
  );
  const [serviceEnabled, setServiceEnabled] = useState(initialServiceEnabled);
  const [draft, setDraft] = useState<ProviderDraft | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const languageCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("qc_locale"));

    const cookieValue = languageCookie?.split("=")[1];

    setLocale(cookieValue === "ar" ? "ar" : "en");
  }, []);

  const canCreate = providers.length < 7;

  const activeCount = useMemo(
    () => providers.filter((provider) => provider.enabled).length,
    [providers],
  );

  function showError(error: unknown) {
    setIsError(true);
    setMessage(getErrorMessage(error, locale));
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
      providerType: provider.providerType,
      baseUrl: provider.baseUrl,
      apiKey: "",
      clearApiKey: false,
      region: provider.region ?? "",
      model: provider.model ?? "",
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
      const payload = {
        id: draft.id,
        name: draft.name,
        providerType: draft.providerType,
        baseUrl: draft.baseUrl,
        apiKey: draft.apiKey ? draft.apiKey : undefined,
        clearApiKey: draft.clearApiKey,
        region: draft.region ? draft.region : null,
        model: draft.model ? draft.model : null,
        timeoutMs: draft.timeoutMs,
        enabled: draft.enabled,
        sortOrder: draft.sortOrder,
      };

      const result = draft.id
        ? await updateTranslationProviderAction(payload)
        : await createTranslationProviderAction(payload);

      if (result && typeof result === "object" && "error" in result) {
        setIsError(true);
        notify.error(t(locale, "genericErrorTitle"), result.error);
        setMessage(result.error);
        return;
      }

      setDraft(null);
      setIsError(false);
      setMessage(t(locale, "translationProviderSavedMessage"));

      setTimeout(() => {
        router.refresh();
      }, 800);
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
      const result = await setTranslationProviderEnabledAction({
        id: provider.id,
        enabled: !provider.enabled,
      });

      if (result && typeof result === "object" && "error" in result) {
        setIsError(true);
        setMessage(result.error);
        notify.error(result.error);
        return;
      }

      setProviders((current) =>
        sortProviders(
          current.map((p) =>
            p.id === provider.id ? { ...p, enabled: !p.enabled } : p,
          ),
        ),
      );

      setIsError(false);
      notify.success(
        `${provider.name} ${t(
          locale,
          provider.enabled
            ? "providerDisabledStatusMessage"
            : "providerEnabledStatusMessage",
        )}`,)
      setMessage(
        `${provider.name} ${t(
          locale,
          provider.enabled
            ? "providerDisabledStatusMessage"
            : "providerEnabledStatusMessage",
        )}`,
      );

      router.refresh();
    } catch (error) {
      showError(error);
    } finally {
      setPending(false);
    }
  }

  async function removeProvider(provider: ProviderItem) {
    if (pending) return;

    const confirmed = window.confirm(
      `${t(locale, "deleteTranslationProviderConfirmPrefix")} "${provider.name}"? ${t(
        locale,
        "deleteTranslationProviderConfirmSuffix",
      )}`,
    );

    if (!confirmed) return;

    setPending(true);
    setMessage(null);

    try {
      const result = await deleteTranslationProviderAction(provider.id);

      if (result && typeof result === "object" && "error" in result) {
        setIsError(true);
        setMessage(result.error);
        notify.error(result.error);
        return;
      }

      setProviders((current) => current.filter((p) => p.id !== provider.id));

      if (draft?.id === provider.id) {
        setDraft(null);
      }

      setIsError(false);
      setMessage(t(locale, "translationProviderDeletedMessage"));
      notify.success(t(locale, "translationProviderDeletedMessage"))
      router.refresh();
    } catch (error) {
      showError(error);
    } finally {
      setPending(false);
    }
  }

  async function toggleService() {
    if (pending) return;

    const nextEnabled = !serviceEnabled;

    setPending(true);
    setMessage(null);

    try {
      const result = await setTranslationServiceEnabledAction({
        enabled: nextEnabled,
      });

      if ("error" in result) {
        setIsError(true);
        notify.error(result.error);
        setMessage(result.error);
        return;
      }

      setServiceEnabled(result.enabled);
      setIsError(false);
      notify.success(
        t(
          locale,
          nextEnabled
            ? "translationServiceEnabledMessage"
            : "translationServiceDisabledMessage",
        ),)
      setMessage(
        t(
          locale,
          nextEnabled
            ? "translationServiceEnabledMessage"
            : "translationServiceDisabledMessage",
        ),
      );

      router.refresh();
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
        aria-labelledby="translation-service-heading"
        className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 border border-primary/65/40 shadow shadow-primary/80 bg-primary/5"
      >
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                serviceEnabled
                  ? "bg-success/10 text-success"
                  : "bg-base-200 text-base-content/90 font-semibold"
              }`}
            >
              {serviceEnabled ? (
                <Languages className="size-5" aria-hidden="true" />
              ) : (
                <Activity className="size-5" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="translation-service-heading"
                  className="text-lg font-semibold tracking-tight sm:text-xl"
                >
                  {t(locale, "translationServiceHeading")}
                </h2>

                <span
                  className={`badge badge-sm text-lg font-semibold ${
                    serviceEnabled
                      ? "badge-success badge-outline"
                      : "badge-ghost"
                  }`}
                >
                  <span
                    className={`mr-1.5 size-1.5 rounded-full ${
                      serviceEnabled ? "bg-success" : "bg-base-content/40"
                    }`}
                    aria-hidden="true"
                  />
                  {serviceEnabled
                    ? t(locale, "aiServiceEnabledBadge")
                    : t(locale, "aiServiceDisabledBadge")}
                </span>
              </div>

              <p className="max-w-2xl text-lg leading-8 text-base-content/90 font-semibold">
                {serviceEnabled
                  ? t(locale, "translationServiceEnabledDetails")
                  : t(locale, "translationServiceDisabledDetails")}
              </p>

              <p className="flex items-start gap-2 text-[16px] leading-7 text-base-content/90 font-semibold">
                <ArrowDownUp
                  className="mt-0.5 size-5 shrink-0"
                  aria-hidden="true"
                />
                {t(locale, "translationExecutionSequenceNote")}
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`btn w-full shrink-0 sm:w-fit ${
              serviceEnabled ? "btn-outline btn-error" : "btn-primary"
            }`}
            disabled={pending}
            onClick={toggleService}
          >
            {pending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : serviceEnabled ? (
              <X className="size-4" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}

            {serviceEnabled
              ? t(locale, "disableTranslationServiceButton")
              : t(locale, "enableTranslationServiceButton")}
          </button>
        </div>
      </section>

      {/* Action feedback */}
      {message ? (
        <div
          className={`alert items-start ${
            isError ? "alert-error" : "alert-success"
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
            className="text-[15px] btn btn-ghost btn-xs ml-auto shrink-0"
            aria-label={t(locale, "dismissMessageAria")}
            onClick={() => setMessage(null)}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {/* Provider inventory */}
      <section
        aria-labelledby="configured-translation-providers-heading"
        className="min-w-0 rounded-3xl border border-base-300 bg-base-100 border border-primary/65/40 shadow shadow-primary/80 bg-primary/5"
      >
        <div className="space-y-5 p-4 sm:p-6 lg:p-7">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="configured-translation-providers-heading"
                  className="text-lg font-semibold tracking-tight sm:text-xl"
                >
                  {t(locale, "configuredTranslationProvidersHeading")}
                </h2>

                <span className="badge badge-ghost">
                  {providers.length} {t(locale, "ofLabel")} 7
                </span>
              </div>

              <p className="text-lg leading-8 text-base-content/90 font-semibold">
                {t(locale, "configuredTranslationProvidersDesc")}
              </p>
            </div>

            <button
              type="button"
              className="text-[15px] btn btn-primary w-full shrink-0 sm:w-fit"
              disabled={!canCreate || pending}
              onClick={beginCreate}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t(locale, "addProviderButton")}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-primary/65 bg-base-100 p-3.5">
              <div className="flex items-center gap-2 text-[16px] text-base-content/90 font-semibold">
                <Database className="size-4" aria-hidden="true" />
                {t(locale, "configuredMetricLabel")}
              </div>

              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {providers.length}
                <span className="ml-1 text-lg font-normal text-base-content/90 font-semibold">
                  / 7
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-primary/65 bg-base-100 p-3.5">
              <div className="flex items-center gap-2 text-[16px] text-base-content/90 font-semibold">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {t(locale, "enabledEnginesLabel")}
              </div>

              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-primary/65 bg-base-100 p-3.5">
              <div className="flex items-center gap-2 text-[16px] text-base-content/90 font-semibold">
                <Activity className="size-4" aria-hidden="true" />
                {t(locale, "serviceStateLabel")}
              </div>

              <p
                className={`mt-2 text-lg font-semibold ${
                  serviceEnabled ? "text-success" : "text-base-content/90 font-semibold"
                }`}
              >
                {serviceEnabled
                  ? t(locale, "globallyEnabledText")
                  : t(locale, "globallyDisabledText")}
              </p>
            </div>
          </div>

          {providers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base-300 px-4 py-10 text-center sm:px-8">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-base-200 text-base-content/90 font-semibold">
                <Globe className="size-6" aria-hidden="true" />
              </div>

              <h3 className="mt-4 font-semibold">
                {t(locale, "noTranslationProvidersTitle")}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-lg leading-8 text-base-content/90 font-semibold">
                {t(locale, "noTranslationProvidersDesc")}
              </p>

              <button
                type="button"
                className="text-[15px] btn btn-primary mt-5"
                disabled={!canCreate || pending}
                onClick={beginCreate}
              >
                <Plus className="size-4" aria-hidden="true" />
                {t(locale, "addYourFirstProviderButton")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <article
                  key={provider.id}
                  className={`min-w-0 overflow-hidden rounded-2xl border transition-colors ${
                    provider.enabled
                      ? "bg-primary/10 border-primary/65"
                      : "bg-error/10 border-error/65"
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Languages className="size-5" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-neutral badge-sm text-sm px-2">
                              {t(locale, "priorityLabel")}{" "}
                              {provider.sortOrder + 1}
                            </span>

                            <span className="badge badge-outline badge-sm text-sm uppercase">
                              {provider.providerType}
                            </span>

                            <span
                              className={`badge badge-sm text-sm ${
                                provider.enabled
                                  ? "badge-success badge-outline"
                                  : "badge-ghost"
                              }`}
                            >
                              {provider.enabled
                                ? t(locale, "aiServiceEnabledBadge")
                                : t(locale, "aiServiceDisabledBadge")}
                            </span>
                          </div>

                          <h3 className="break-words text-base font-semibold sm:text-lg">
                            {provider.name}
                          </h3>

                          <p className="text-[16px] text-base-content/90 font-semibold sm:text-lg">
                            {t(locale, "endpointResourceLabel")}{" "}
                            {provider.baseUrl}
                          </p>
                        </div>
                      </div>

                      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="min-w-0 rounded-xl bg-base-200/50 p-3">
                          <p className="text-[16px] font-medium text-base-content/90 font-semibold">
                            {t(locale, "regionModelHeading")}
                          </p>

                          <p className="mt-1 break-words text-lg leading-7">
                            {provider.region
                              ? `${t(locale, "regionPrefix")} ${provider.region}`
                              : ""}
                            {provider.region && provider.model ? " · " : ""}
                            {provider.model
                              ? `${t(locale, "modelPrefix")} ${provider.model}`
                              : !provider.region && !provider.model
                                ? t(locale, "standardConfigurationText")
                                : ""}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-xl bg-base-200/50 p-3">
                          <p className="text-[16px] font-medium text-base-content/90 font-semibold">
                            {t(locale, "timeoutAndCredentialsHeading")}
                          </p>

                          <p className="mt-1 break-words text-lg leading-7">
                            {provider.timeoutMs}{" "}
                            {t(locale, "millisecondsTimeout")} ·{" "}
                            {provider.hasApiKey
                              ? t(locale, "apiKeySavedStatus")
                              : t(locale, "noApiKeyStatus")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap gap-2 border-t border-base-300/70 pt-4 xl:w-auto xl:shrink-0 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                      <button
                        type="button"
                        className="text-[15px] btn btn-sm btn-outline flex-1 sm:flex-none"
                        disabled={pending}
                        onClick={() => beginEdit(provider)}
                      >
                        <Settings2 className="size-4" aria-hidden="true" />
                        {t(locale, "editButton")}
                      </button>

                      <button
                        type="button"
                        className="text-[15px] btn btn-sm btn-outline flex-1 sm:flex-none"
                        disabled={pending}
                        onClick={() => toggleProvider(provider)}
                      >
                        {provider.enabled ? (
                          <X className="size-4" aria-hidden="true" />
                        ) : (
                          <Check className="size-4" aria-hidden="true" />
                        )}

                        {provider.enabled
                          ? t(locale, "disableButton")
                          : t(locale, "enableButton")}
                      </button>

                      <button
                        type="button"
                        className="text-[15px] btn btn-sm btn-outline btn-error flex-1 sm:flex-none"
                        disabled={pending}
                        onClick={() => removeProvider(provider)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        {t(locale, "deleteButton")}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-base-300/70 bg-base-200/30 p-3.5 text-[16px] leading-7 text-base-content/90 font-semibold">
            <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />

            <p>
              <span className="font-semibold text-base-content/90 font-semibold">
                {t(locale, "translationSecurityNoticeTitle")}
              </span>{" "}
              {t(locale, "translationSecurityNoticeDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Create / edit form modal */}
      <Dialog
        open={Boolean(draft)}
        onOpenChange={(open) => !open && setDraft(null)}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-primary/65/30 bg-base-100">
          {draft ? (
            <section
              aria-labelledby="translation-provider-editor-heading"
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
                        id="translation-provider-editor-heading"
                        className="text-lg font-semibold tracking-tight sm:text-xl"
                      >
                        {draft.id
                          ? t(locale, "editTranslationProviderTitle")
                          : t(locale, "addTranslationProviderTitle")}
                      </h2>

                      <p className="mt-1 text-lg leading-7 text-base-content/90 font-semibold">
                        {t(locale, "translationProviderEditorDesc")}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-[15px] btn btn-ghost btn-sm shrink-0"
                    disabled={pending}
                    onClick={() => setDraft(null)}
                  >
                    <X className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      {t(locale, "cancel")}
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-7">
                <form className="space-y-7" onSubmit={saveProvider}>
                  <fieldset disabled={pending} className="min-w-0 space-y-7">
                    <legend className="sr-only">
                      {t(locale, "translationProviderSettingsLegend")}
                    </legend>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">
                          {t(locale, "providerPropertiesHeading")}
                        </h3>

                        <p className="mt-1 text-lg text-base-content/90 font-semibold">
                          {t(locale, "providerPropertiesDesc")}
                        </p>
                      </div>

                      <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                        <label className="form-control min-w-0 gap-1">
                          <span className="label-text font-medium">
                            {t(locale, "displayNameLabel")}
                          </span>

                          <input
                            className="input input-bordered w-full border"
                            required
                            maxLength={80}
                            value={draft.name}
                            onChange={(event) =>
                              updateDraft("name", event.target.value)
                            }
                            placeholder={t(
                              locale,
                              "translationProviderNamePlaceholder",
                            )}
                          />

                          <FieldHint>
                            {t(locale, "translationProviderNameHint")}
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1">
                          <span className="label-text font-medium">
                            {t(locale, "providerTypeLabel")}
                          </span>

                          <select
                            className="select select-bordered border w-full uppercase"
                            value={draft.providerType}
                            onChange={(event) => {
                              const val = event.target.value as ProviderType;

                              updateDraft("providerType", val);

                              if (val === "ai_local" || val === "ai_openrouter") {
                                updateDraft("model", "");
                              } else if (
                                !(val === "google" || val === "microsoft")
                              ) {
                                updateDraft("region", "");
                              }
                            }}
                          >
                            <option value="google">Google Translate</option>
                            <option value="microsoft">
                              Microsoft Translator
                            </option>
                            <option value="deepl">DeepL</option>
                            <option value="libretranslate">
                              LibreTranslate
                            </option>
                            <option value="lingva">Lingva Translate</option>
                            <option value="ai_openrouter">AI OpenRouter</option>
                            <option value="ai_local">AI Local Model</option>
                          </select>

                          <FieldHint>
                            {t(locale, "translationProviderTypeHint")}
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1">
                          <span className="label-text font-medium">
                            {t(locale, "executionPriorityLabel")}
                          </span>

                          <select
                            className="select select-bordered w-full border"
                            value={draft.sortOrder}
                            onChange={(event) =>
                              updateDraft(
                                "sortOrder",
                                Number(event.target.value),
                              )
                            }
                          >
                            {Array.from(
                              {
                                length: Math.min(
                                  7,
                                  providers.length + (draft.id ? 0 : 1),
                                ),
                              },
                              (_, position) => (
                                <option key={position} value={position}>
                                  {t(locale, "priorityRankLabel")}{" "}
                                  {position + 1}
                                </option>
                              ),
                            )}
                          </select>

                          <FieldHint>
                            {t(locale, "translationExecutionPriorityHint")}
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1 sm:col-span-2 xl:col-span-1">
                          <span className="label-text font-medium">
                            {t(locale, "baseUrlProjectIdLabel")} *
                          </span>

                          <input
                            className="input input-bordered w-full border"
                            required
                            maxLength={500}
                            value={draft.baseUrl}
                            type="url"
                            dir="ltr"
                            onChange={(event) =>
                              updateDraft("baseUrl", event.target.value)
                            }
                            placeholder="https://api.deepl.com/v2/translate"
                          />

                          <FieldHint>
                            {t(locale, "baseUrlProjectIdHint")}
                          </FieldHint>
                        </label>

                        {(draft.providerType === "ai_local" ||
                          draft.providerType === "ai_openrouter") && (
                          <label className="form-control min-w-0 gap-1">
                            <span className="label-text font-medium">
                              {t(locale, "modelPrefix")} *
                            </span>

                            <input
                              className="input input-bordered w-full border"
                              maxLength={180}
                              value={draft.model}
                              required
                              dir="ltr"
                              onChange={(event) =>
                                updateDraft("model", event.target.value)
                              }
                              placeholder={t(
                                locale,
                                "translationModelPlaceholder",
                              )}
                            />

                            <FieldHint>
                              {t(locale, "translationModelHint")}
                            </FieldHint>
                          </label>
                        )}

                        {(draft.providerType === "microsoft" ||
                          draft.providerType === "google") && (
                          <label className="form-control min-w-0 gap-1">
                            <span className="label-text font-medium">
                              {t(locale, "regionOptionalLabel")}
                            </span>

                            <input
                              className="input input-bordered w-full border"
                              maxLength={200}
                              value={draft.region}
                              onChange={(event) =>
                                updateDraft("region", event.target.value)
                              }
                              placeholder={t(
                                locale,
                                "translationRegionPlaceholder",
                              )}
                            />

                            <FieldHint>
                              {t(locale, "translationRegionHint")}
                            </FieldHint>
                          </label>
                        )}

                        <label className="form-control min-w-0 gap-1">
                          <span className="label-text font-medium">
                            {t(locale, "timeoutMsLabel")}
                          </span>

                          <input
                            className="input input-bordered w-full border"
                            type="number"
                            min={1000}
                            max={1800000}
                            step={1000}
                            required
                            value={draft.timeoutMs}
                            onChange={(event) =>
                              updateDraft(
                                "timeoutMs",
                                Number(event.target.value),
                              )
                            }
                          />

                          <FieldHint>
                            {t(locale, "translationTimeoutHint")}
                          </FieldHint>
                        </label>

                        <label className="form-control min-w-0 gap-1 sm:col-span-2">
                          <span className="label-text font-medium">
                            {t(locale, "translationApiKeyLabel")}
                          </span>

                          <input
                            className="input input-bordered w-full border"
                            type="password"
                            autoComplete="new-password"
                            maxLength={2000}
                            dir="ltr"
                            value={draft.apiKey}
                            onChange={(event) =>
                              updateDraft("apiKey", event.target.value)
                            }
                            placeholder={
                              draft.id
                                ? t(
                                    locale,
                                    "leaveBlankToKeepExistingKeyPlaceholder",
                                  )
                                : t(
                                    locale,
                                    "enterProviderCredentialPlaceholder",
                                  )
                            }
                          />

                          <FieldHint>
                            {t(locale, "translationApiKeyHint")}
                          </FieldHint>
                        </label>
                      </div>
                    </div>

                    <div className="divider my-0" />

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">
                          {t(locale, "optionsAndStatusHeading")}
                        </h3>

                        <p className="mt-1 text-lg text-base-content/90 font-semibold">
                          {t(locale, "optionsAndStatusDesc")}
                        </p>
                      </div>

                      {draft.id ? (
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
                            <span className="block text-lg font-medium">
                              {t(
                                locale,
                                "clearSavedApiKeyCredentialLabel",
                              )}
                            </span>

                            <span className="mt-1 block text-[16px] leading-7 text-base-content/90 font-semibold">
                              {t(locale, "removesStoredSecretTokenDesc")}
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
                          <span className="block text-lg font-medium">
                            {t(locale, "enableTranslationProviderLabel")}
                          </span>

                          <span className="mt-1 block text-[16px] leading-7 text-base-content/90 font-semibold">
                            {t(locale, "participatesInFallbackDesc")}
                          </span>
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  <div className="flex flex-col-reverse gap-3 border-t border-base-300 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="text-[15px] btn btn-ghost w-full sm:w-auto"
                      disabled={pending}
                      onClick={() => setDraft(null)}
                    >
                      {t(locale, "cancel")}
                    </button>

                    <button
                      type="submit"
                      className="text-[15px] btn btn-primary w-full sm:w-auto"
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

                      {pending
                        ? t(locale, "savingButtonText")
                        : t(locale, "saveTranslationProviderButton")}
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
