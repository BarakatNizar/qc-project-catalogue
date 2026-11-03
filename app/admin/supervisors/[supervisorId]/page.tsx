
// /admin/supervisors/[supervisorId]/page.tsx

"use client";

import { useState, useEffect, use } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { FormField, TextInput } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

import type { UserDto } from "@/modules/user/mappers/user-mapper";
import { getSupervisorAction } from "@/Interfaces/getters/user.getters";
import type {
  ResetSupervisorPasswordPayload,
  UpdateSupervisorPayload,
} from "@/shared/validation/user";
import {
  deleteSupervisorAction,
  passwordResetSupervisorAction,
  updateSupervisorAction,
} from "@/Interfaces/actions/users.actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { t, type Locale } from "@/shared/i18n/dictionary";

type SupervisorAccountPageProps = {
  params: Promise<{ supervisorId: string }>;
};

export default function SupervisorAccountPage({
  params,
}: SupervisorAccountPageProps) {
  const { supervisorId } = use(params);
  const router = useRouter();

  const [locale, setLocale] = useState<Locale>("en");

  // Read the application language from the app-language cookie.
  useEffect(() => {
    const languageCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("qc_locale"));

    const cookieValue = languageCookie?.split("=")[1];

    setLocale(cookieValue === "ar" ? "ar" : "en");
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string>();
  const [supervisor, setSupervisor] = useState<UserDto | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      setSupervisor(null);

      try {
        const res = await getSupervisorAction(supervisorId);

        if (cancelled) return;

        if ("error" in res) {
          setError(res.error);
        } else {
          setSupervisor(res);
        }
      } catch {
        if (!cancelled) {
          setError(t(locale, "unableToLoadSupervisorError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [supervisorId, locale]);

  const handleUpdateSupervisor = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!supervisor || isUpdating) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const emailValue = formData.get("email");

    const payload: UpdateSupervisorPayload = {
      supervisorId: supervisor.id,
      data: {
        name: String(formData.get("name") ?? "").trim(),
        email: emailValue ? String(emailValue).trim() : undefined,
      },
    };

    setIsUpdating(true);

    try {
      const res = await updateSupervisorAction(payload);

      if ("error" in res) {
        notify.error(t(locale, "failedToUpdateSupervisorError"), res.error);
        return;
      }

      setSupervisor((current) => {
        if (!current) return current;

        return {
          ...current,
          name: payload.data.name,
          email:
            payload.data.email !== undefined
              ? payload.data.email
              : current.email,
        };
      });

      notify.success(
        t(locale, "supervisorDetailsUpdatedSuccessTitle"),
        t(locale, "changesSavedSuccessDesc"),
      );
    } catch {
      notify.error(
        t(locale, "failedToUpdateSupervisorError"),
        t(locale, "unexpectedErrorTryAgain"),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!password) {
      notify.system(t(locale, "setNewPasswordToast"));
      return;
    }

    if (!supervisor || isResetting) return;

    const payload: ResetSupervisorPasswordPayload = {
      supervisorId: supervisor.id,
      data: { password },
    };

    setIsResetting(true);

    try {
      const res = await passwordResetSupervisorAction(payload);

      if ("error" in res) {
        notify.error(t(locale, "passwordResetFailedError"), res.error);
        return;
      }

      notify.success(
        t(locale, "passwordResetSuccessTitle"),
        t(locale, "temporaryPasswordAssignedDesc"),
      );

      setPassword("");
    } catch {
      notify.error(
        t(locale, "passwordResetFailedError"),
        t(locale, "unexpectedErrorTryAgain"),
      );
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteSupervisor = async () => {
    if (!supervisor || isDeleting) return;

    setIsDeleting(true);

    try {
      const res = await deleteSupervisorAction(supervisor.id);

      if ("error" in res) {
        notify.error(t(locale, "failedToDeleteSupervisorError"), res.error);
        setIsDeleting(false);
        return;
      }

      notify.success(
        t(locale, "deleteSupervisorSuccessTitle"),
        t(locale, "redirectingToSupervisorsDirectory"),
      );

      router.push("/admin/supervisors");
    } catch {
      notify.error(
        t(locale, "failedToDeleteSupervisorError"),
        t(locale, "unexpectedErrorTryAgain"),
      );
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-7xl space-y-6"
        role="status"
        aria-label={t(locale, "loadingSupervisorAccountAria")}
      >
        <div className="flex items-center gap-3">
          <div className="size-11 shrink-0 animate-pulse rounded-2xl bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-6 w-56 max-w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-72 max-w-full animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="space-y-6 rounded-3xl border border-border/70 bg-card p-5 sm:p-7"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-64 max-w-full animate-pulse rounded bg-muted" />
              <div className="space-y-3">
                <div className="h-11 animate-pulse rounded-xl bg-muted" />
                <div className="h-11 animate-pulse rounded-xl bg-muted" />
                <div className="h-10 w-36 animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">
          {t(locale, "loadingSupervisorAccountDetails")}
        </span>
      </div>
    );
  }

  if (error || !supervisor) {
    return (
      <ErrorState
        message={error || t(locale, "supervisorNotFoundMessage")}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <PageHeading
        eyebrow={t(locale, "supervisorAccountLabel")}
        title={t(locale, "manageSupervisorTitle")}
        description={t(locale, "manageSupervisorDesc")}
        action={
          <Link
            href="/admin/supervisors"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-[16px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {t(locale, "backToDirectoryButton")}
          </Link>
        }
      />

      {/* Supervisor identity */}
      <section
        aria-label={t(locale, "supervisorIdentityAria")}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 size-52 rounded-full bg-primary/5 blur-3xl"
        />

        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary sm:size-16">
            <UserRound size={28} strokeWidth={1.8} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[15px] font-semibold uppercase tracking-wider text-primary">
                <ShieldCheck size={13} aria-hidden="true" />
                {t(locale, "supervisorAccountLabel")}
              </span>
            </div>

            <h2 className="break-words text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {supervisor.name}
            </h2>

            <div className="flex min-w-0 flex-col gap-2 text-[16px] font-semibold text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
              <span className="inline-flex min-w-0 items-start gap-2">
                <Fingerprint
                  size={16}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="break-all font-mono text-[15px] sm:text-[16px]">
                  {supervisor.loginId}
                </span>
              </span>

              {supervisor.email && (
                <span className="inline-flex min-w-0 items-start gap-2">
                  <Mail
                    size={16}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="break-all">{supervisor.email}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Account management panels */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2 xl:gap-6">
        {/* Edit account details */}
        <section className="min-w-0 space-y-6 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UserRound size={20} aria-hidden="true" />
            </div>

            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-bold tracking-tight sm:text-lg">
                {t(locale, "editableDetailsTitle")}
              </h2>
              <p className="text-[16px] leading-relaxed font-semibold text-muted-foreground">
                {t(locale, "updateSupervisorDetailsDesc")}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Fingerprint
                size={17}
                className="mt-0.5 shrink-0 font-semibold text-muted-foreground"
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[15px] font-semibold uppercase tracking-wider font-semibold text-muted-foreground">
                  {t(locale, "permanentLoginIdLabel")}
                </p>
                <p className="break-all font-mono text-[16px] font-medium text-foreground">
                  {supervisor.loginId}
                </p>
                <p className="text-[15px] leading-relaxed font-semibold text-muted-foreground">
                  {t(locale, "permanentLoginIdReadOnlyDesc")}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateSupervisor} className="space-y-5">
            <FormField
              label={t(locale, "fullNameLabel")}
              name="name"
            >
              <TextInput
                name="name"
                required
                defaultValue={supervisor.name}
                autoComplete="name"
                placeholder={t(locale, "supervisorNamePlaceholder")}
              />
            </FormField>

            <FormField
              label={t(locale, "emailOptionalLabel")}
              name="email"
              hint={t(locale, "emailOptionalHint")}
            >
              <TextInput
                name="email"
                type="email"
                defaultValue={supervisor.email ?? ""}
                autoComplete="email"
                placeholder={t(locale, "emailAddressPlaceholderExample")}
              />
            </FormField>

            <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[15px] leading-relaxed font-semibold text-muted-foreground">
                {t(locale, "saveChangesPrompt")}
              </p>

              <Button
                type="submit"
                disabled={isUpdating || isResetting || isDeleting}
                className="min-h-11 w-full gap-2 rounded-xl px-5 font-semibold shadow-sm sm:w-auto"
              >
                {isUpdating ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    {t(locale, "savingChangesButton")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    {t(locale, "saveChanges")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* Password reset */}
        <section className="min-w-0 space-y-6 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <KeyRound size={20} aria-hidden="true" />
            </div>

            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-bold tracking-tight sm:text-lg">
                {t(locale, "resetPasswordCardTitle")}
              </h2>
              <p className="text-[16px] leading-relaxed font-semibold text-muted-foreground">
                {t(locale, "resetPasswordCardDesc")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <LockKeyhole
              size={18}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />

            <div className="space-y-1">
              <p className="text-[16px] font-semibold text-foreground">
                {t(locale, "handleTemporaryCredentialsTitle")}
              </p>
              <p className="text-[15px] leading-relaxed font-semibold text-muted-foreground">
                {t(locale, "handleTemporaryCredentialsDesc")}
              </p>
            </div>
          </div>

          <section className="space-y-5">
            <FormField
              label={t(locale, "newPasswordLabel")}
              name="password"
              hint={t(locale, "newPasswordHint")}
            >
              <TextInput
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={9}
                maxLength={128}
                autoComplete="new-password"
                placeholder={t(locale, "newPasswordPlaceholder")}
              />
            </FormField>

            <div className="flex items-start gap-2 text-[15px] leading-relaxed font-semibold text-muted-foreground">
              <ShieldCheck
                size={15}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>{t(locale, "resetPasswordNotice")}</p>
            </div>

            <div className="border-t border-border/60 pt-5">
              <ConfirmDialog
                title={t(locale, "resetPasswordConfirmTitle")}
                style="warn"
                onCertain={() => handlePasswordReset()}
                triggerChildren={
                  isResetting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      {t(locale, "resettingPasswordButton")}
                    </>
                  ) : (
                    <div className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-5 py-2.5 text-[16px] font-semibold text-destructive transition-colors hover:bg-destructive/15">
                      <KeyRound size={16} aria-hidden="true" />
                      {t(locale, "resetPasswordActionButton")}
                    </div>
                  )
                }
              />
            </div>
          </section>
        </section>
      </div>

      {/* Destructive account action */}
      <aside className="overflow-hidden rounded-3xl border border-destructive/25 bg-card shadow-sm">
        <div className="flex items-start gap-3 border-b border-destructive/15 bg-destructive/5 px-5 py-4 sm:px-7">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle size={19} aria-hidden="true" />
          </div>

          <div className="min-w-0 space-y-1">
            <h2 className="font-bold tracking-tight text-foreground">
              {t(locale, "dangerZoneTitle")}
            </h2>
            <p className="text-[16px] leading-relaxed font-semibold text-muted-foreground">
              {t(locale, "deleteSupervisorCardDesc")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 sm:px-7 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Trash2
              size={17}
              className="mt-0.5 shrink-0 text-destructive"
              aria-hidden="true"
            />

            <div className="min-w-0 space-y-1">
              <p className="text-[16px] font-semibold text-foreground">
                {t(locale, "deleteSupervisorActionTitle")}
              </p>
              <p className="max-w-2xl text-[15px] leading-relaxed font-semibold text-muted-foreground">
                {t(locale, "deleteSupervisorBehaviorDesc")}
              </p>
            </div>
          </div>

          <div className="w-full shrink-0 md:w-auto">
            <ConfirmDialog
              title={t(locale, "deleteSupervisorConfirmTitle")}
              style="danger"
              onCertain={() => handleDeleteSupervisor()}
              triggerChildren={
                isDeleting ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    {t(locale, "deletingAccountButton")}
                  </>
                ) : (
                  <div className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive px-5 py-2.5 text-[16px] font-semibold text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 md:w-auto">
                    <Trash2 size={16} aria-hidden="true" />
                    {t(locale, "deleteAccountButton")}
                  </div>
                )
              }
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
