
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleUserRound,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  Loader2,
  Save,
  Info,
} from "lucide-react";

import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { FormField, TextInput } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { getProfileAction } from "@/Interfaces/getters/user.getters";
import { updateProfileAction } from "@/Interfaces/actions/auth.actions";
import type { UserDto } from "@/modules/user/mappers/user-mapper";
import type { UpdateProfilePayload } from "@/shared/validation/user";
import { t, type Locale } from "@/shared/i18n/dictionary";

export default function ProfilePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserDto | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const languageCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("qc_locale"))
      ?.split("=")[1];

    if (languageCookie === "ar" || languageCookie === "en") {
      setLocale(languageCookie);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const res = await getProfileAction();

        if (cancelled) return;

        if ("error" in res) {
          setError(res.error);
        } else {
          setProfile(res);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);

        if (!cancelled) {
          setError(t(locale, "profileLoadError"));
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
  }, [locale]);

  const handleUpdateProfile = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!profile || saving) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const emailValue = formData.get("email");

    const payload: UpdateProfilePayload = {
      name: String(formData.get("name") ?? ""),
      email:
        emailValue && String(emailValue).trim()
          ? String(emailValue).trim()
          : null,
    };

    setSaving(true);

    try {
      const res = await updateProfileAction(payload);

      if ("error" in res) {
        notify.error(t(locale, "profileUpdateFailed"), res.error);
        return;
      }

      notify.success(
        t(locale, "profileSaved"),
        t(locale, "profileUpdatedSuccessfully"),
      );

      try {
        const updated = await getProfileAction();

        if ("error" in updated) {
          notify.warning(
            t(locale, "profileSaved"),
            t(locale, "profileRefreshWarning"),
          );
        } else {
          setProfile(updated);
        }
      } catch (refreshError) {
        console.error("Failed to refresh profile:", refreshError);

        notify.warning(
          t(locale, "profileSaved"),
          t(locale, "profileRefreshWarning"),
        );
      }
    } catch (updateError) {
      console.error("Failed to update profile:", updateError);

      notify.error(
        t(locale, "profileUpdateFailed"),
        t(locale, "profileSaveUnexpectedError"),
      );
    } finally {
      setSaving(false);
    }
  };

  const roleLabel =
    profile?.role === "ADMIN"
      ? t(locale, "roleAdmin")
      : profile?.role === "SUPERVISOR"
        ? t(locale, "roleSupervisor"): t(locale, "roleStudent")
          

  if (loading) {
    return (
      <div
        role="status"
        aria-label={t(locale, "loadingYourProfile")}
        className="page-shell flex min-h-[24rem] items-center justify-center px-4 py-12"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Loader2
              size={26}
              className="animate-spin motion-reduce:animate-none"
            />
          </span>
          <div className="space-y-1">
            <p className="text-lg leading-relaxed font-semibold text-foreground">
              {t(locale, "loadingYourProfile")}
            </p>
            <p className="text-[16px] leading-relaxing py-1 opacity-90">
              {t(locale, "retrievingAccountInfo")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-shell px-4 py-10 sm:py-14">
        <ErrorState
          message={error || t(locale, "profileNotFound")}
        />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-screen-2xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-12 lg:px-8">
      <PageHeading
        eyebrow={t(locale, "accountSettings")}
        title={t(locale, "yourProfile")}
        description={t(locale, "profileDesc")}
      />

      {/* Profile overview */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"
        />

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 sm:size-16">
              <CircleUserRound size={30} strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <p className="text-[16px] leading-relaxing py-1 font-semibold uppercase tracking-wide opacity-90">
                {t(locale, "accountOverview")}
              </p>
              <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                {profile.name}
              </h2>
              <p className="mt-1 break-all text-lg leading-relaxed opacity-90">
                {profile.email || t(locale, "noEmailAdded")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[16px] leading-relaxing py-1 font-semibold text-foreground">
              <ShieldCheck size={14} className="text-primary" />
              {roleLabel}
            </span>

            {profile.role === "STUDENT" && profile.collegeId && (
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[16px] leading-relaxing py-1 opacity-90">
                <span className="shrink-0">
                  {t(locale, "collegeIdLabel")}
                </span>
                <span className="break-all font-semibold text-foreground">
                  {profile.collegeId}
                </span>
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,500px)] lg:items-start">
        {/* Personal information */}
        <section className="min-w-0 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
          <div className="flex items-start gap-3 border-b border-border/70 p-5 sm:p-7">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <UserRound size={21} />
            </span>

            <div className="min-w-0">
              <h2 className="text-lg leading-relaxed font-bold tracking-tight text-foreground sm:text-xl">
                {t(locale, "personalInformation")}
              </h2>
              <p className="mt-1 text-lg leading-relaxed leading-6 opacity-90">
                {t(locale, "personalInformationDesc")}
              </p>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            {/* Managed account identifiers */}
            <div className="space-y-3">
              <div>
                <h3 className="text-lg leading-relaxed font-semibold text-foreground">
                  {t(locale, "manageDetailsTitle")}
                </h3>
                <p className="mt-1 text-[16px] leading-relaxing py-1 leading-7 opacity-90">
                  {t(locale, "manageDetailsDesc")}
                </p>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-border/70 bg-background/60 p-4">
                  <dt className="text-[16px] leading-relaxing py-1 font-semibold opacity-90">
                    {t(locale, "loginIdLabel")}
                  </dt>
                  <dd className="mt-2 break-all text-lg leading-relaxed font-medium text-foreground">
                    {profile.loginId}
                  </dd>
                  <p className="mt-2 text-[16px] leading-relaxing py-1 opacity-90">
                    {t(locale, "loginIdHint")}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-border/70 bg-background/60 p-4">
                  <dt className="text-[16px] leading-relaxing py-1 font-semibold opacity-90">
                    {t(locale, "accountRoleLabel")}
                  </dt>
                  <dd className="mt-2 break-words text-lg leading-relaxed font-semibold capitalize text-foreground">
                    {roleLabel}
                  </dd>
                  <p className="mt-2 text-[16px] leading-relaxing py-1 opacity-90">
                    {t(locale, "accountRoleHint")}
                  </p>
                </div>

                {profile.role === "STUDENT" && (
                  <div className="min-w-0 rounded-2xl border border-border/70 bg-background/60 p-4 sm:col-span-2">
                    <dt className="text-[16px] leading-relaxing py-1 font-semibold opacity-90">
                      {t(locale, "collegeIdLabel")}
                    </dt>
                    <dd className="mt-2 break-all text-lg leading-relaxed font-semibold text-foreground">
                      {profile.collegeId || t(locale, "collegeIdNotProvided")}
                    </dd>
                    <p className="mt-2 text-[16px] leading-relaxing py-1 opacity-90">
                      {t(locale, "collegeIdHint")}
                    </p>
                  </div>
                )}
              </dl>
            </div>

            <div className="border-t border-border/70" />

            {/* Editable fields */}
            <div className="space-y-2">
              <h3 className="text-lg leading-relaxed font-semibold text-foreground">
                {t(locale, "editableDetailsTitle")}
              </h3>
              <p className="text-[16px] leading-relaxing py-1 leading-7 opacity-90">
                {t(locale, "editableDetailsDesc")}
              </p>
            </div>

            <form
              key={`${profile.name}:${profile.email ?? ""}`}
              onSubmit={handleUpdateProfile}
              aria-busy={saving}
              className="space-y-5"
            >
              <FormField
                label={t(locale, "fullNameLabel")}
                name="name"
                hint={t(locale, "fullNameHint")}
              >
                <TextInput
                  name="name"
                  required
                  minLength={2}
                  maxLength={160}
                  defaultValue={profile.name}
                  autoComplete="name"
                  disabled={saving}
                />
              </FormField>

              <FormField
                label={t(locale, "emailOptionalLabel")}
                name="email"
                hint={t(locale, "emailOptionalHint")}
              >
                <div className="relative">
                  <Mail
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 opacity-90"
                  />
                  <TextInput
                    name="email"
                    type="email"
                    defaultValue={profile.email ?? ""}
                    autoComplete="email"
                    disabled={saving}
                    placeholder={t(locale, "emailAddressPlaceholder")}
                    className="ps-10"
                  />
                </div>
              </FormField>

              <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-[16px] leading-relaxing py-1 leading-7 opacity-90">
                  <Info
                    size={15}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {t(locale, "loginIdRoleNotEditable")}
                  </span>
                </p>

                <Button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 font-semibold shadow-md shadow-primary/15 sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                      {t(locale, "savingProfile")}
                    </>
                  ) : (
                    <>
                      <Save size={16} aria-hidden="true" />
                      {t(locale, "saveProfile")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Security and account support */}
        <aside className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
            <div className="border-b border-border/70 p-5">
              <span className="grid size-11 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                <KeyRound size={21} />
              </span>

              <h2 className="mt-4 text-lg leading-relaxed font-bold tracking-tight text-foreground">
                {t(locale, "passwordAndAccess")}
              </h2>
              <p className="mt-2 text-lg leading-relaxed leading-6 opacity-90">
                {t(locale, "passwordAccessDesc")}
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted opacity-90">
                  <LockKeyhole size={17} />
                </span>
                <div>
                  <p className="text-lg leading-relaxed font-semibold text-foreground">
                    {t(locale, "passwordManagement")}
                  </p>
                  <p className="mt-1 text-[16px] leading-relaxing py-1 leading-7 opacity-90">
                    {t(locale, "passwordManagementDesc")}
                  </p>
                </div>
              </div>

              <Link
                href="/change-password"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-lg leading-relaxed font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <KeyRound size={16} aria-hidden="true" />
                {t(locale, "changeYourPassword")}
                <ArrowUpRight
                  size={15}
                  aria-hidden="true"
                  className="ms-auto"
                />
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-primary"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <h3 className="text-lg leading-relaxed font-semibold text-foreground">
                  {t(locale, "institutionManagedAccount")}
                </h3>
                <p className="mt-2 text-[16px] leading-relaxing py-1 leading-7 opacity-90">
                  {t(locale, "institutionManagedDesc")}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p className="text-[16px] leading-relaxing py-1 leading-7 opacity-90">
                {t(locale, "reviewDetailsPrompt")}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
