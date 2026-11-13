"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Fingerprint,
  GraduationCap,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { formatDate } from "@/shared/utils/format";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { FormField, TextInput } from "@/components/ui/form-field";
import { UserDto } from "@/modules/user/mappers/user-mapper";
import { getStudentAction } from "@/Interfaces/getters/user.getters";
import {
  deleteStudentAction,
  passwordResetStudentAction,
} from "@/Interfaces/actions/users.actions";
import { ResetStudentPasswordPayload } from "@/shared/validation/user";
import { t, type Locale } from "@/shared/i18n/dictionary";
import { ConfirmDialog } from "@/components/confirm-dialog";

type StudentDetailsPageProps = {
  params: Promise<{ studentId: string }>;
};

function DetailItem({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
  description?: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-border/60 bg-background/50 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon size={17} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <dt className="text-[16px] py-1 font-medium text-muted-foreground">{label}</dt>
        <dd className="break-words text-lg py-1 font-semibold leading-5 text-foreground [overflow-wrap:anywhere]">
          {value}
        </dd>
        {description ? (
          <p className="break-words text-[16px] py-1 leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LoadingState({ locale }: { locale: Locale }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col justify-center gap-6 px-1"
    >
      <span className="sr-only">
        {t(locale, "studentDetailsLoading")}
      </span>

      <div className="flex items-center gap-4">
        <div className="grid size-14 shrink-0 animate-pulse place-items-center rounded-2xl bg-muted" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="h-7 w-2/3 max-w-sm animate-pulse rounded-lg bg-muted" />
          <div className="h-3 w-full max-w-md animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
        <div className="space-y-5 rounded-2xl border border-border/70 p-5 sm:p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl bg-muted/70"
              />
            ))}
          </div>
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-border/70 bg-muted/40" />
      </div>
    </div>
  );
}

export default function StudentDetailsPage({
  params,
}: StudentDetailsPageProps) {
  const { studentId } = use(params);
  const router = useRouter();

  const [locale, setLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<UserDto | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const languageCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("qc_locale"))
      ?.split("=")[1];

    setLocale(languageCookie === "ar" ? "ar" : "en");
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      setStudent(null);

      try {
        const result = await getStudentAction(studentId);

        if (!active) return;

        if ("error" in result) {
          setError(result.error);
        } else {
          setStudent(result);
        }
      } catch {
        if (active) {
          setError(t(locale, "studentDetailsLoadError"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [studentId, locale]);

  const handlePasswordReset = async (
    e?: React.FormEvent<HTMLFormElement>,
  ) => {
    if (e) e.preventDefault();

    if (!student || isResetting || isDeleting) return;

    const payload: ResetStudentPasswordPayload = {
      studentId: student.id,
      data: {
        password: password,
      },
    };

    setIsResetting(true);

    try {
      const result = await passwordResetStudentAction(payload);

      if ("error" in result) {
        notify.error(t(locale, "studentPasswordResetFailed"), result.error);
        return;
      }

      notify.success(
        t(locale, "studentPasswordResetSuccess"),
        t(locale, "studentTemporaryPasswordAssigned"),
      );

      setPassword("");
    } catch {
      notify.error(
        t(locale, "studentPasswordResetFailed"),
        t(locale, "studentUnexpectedError"),
      );
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!student || isDeleting || isResetting) return;

    setIsDeleting(true);

    try {
      const result = await deleteStudentAction(student.id);

      if ("error" in result) {
        notify.error(t(locale, "studentDeleteFailed"), result.error);
        return;
      }

      notify.success(
        t(locale, "studentAccountDeleted"),
        t(locale, "studentRedirectingToDirectory"),
      );

      router.push("/supervisor/students");
    } catch {
      notify.error(
        t(locale, "studentDeleteFailed"),
        t(locale, "studentUnexpectedError"),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingState locale={locale} />;
  }

  if (error || !student) {
    return (
      <ErrorState
        message={error || t(locale, "studentNotFound")}
      />
    );
  }

  const passwordStatus = student.mustChangePassword
    ? {
      label: t(locale, "studentPasswordChangeRequired"),
      description: t(locale, "studentMustChangePasswordAtSignIn"),
      icon: CircleAlert,
      className:
        "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    }
    : {
      label: t(locale, "studentPasswordChangeNotRequired"),
      description: t(locale, "studentNoInitialPasswordChangeRequired"),
      icon: CheckCircle2,
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };

  const PasswordStatusIcon = passwordStatus.icon;

  return (
    <main className="mx-auto w-full min-w-0 space-y-6 pb-8">
      <PageHeading
        eyebrow={t(locale, "studentAccountEyebrow")}
        title={student.name}
        description={t(locale, "studentDetailsPageDescription")}
        action={
          <Link
            href="/supervisor/students"
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-border bg-background px-4 py-2 text-lg py-1 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{t(locale, "studentsDirectoryLink")}</span>
          </Link>
        }
      />

      <section
        aria-label={t(locale, "studentIdentitySection")}
        className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent"
        />

        <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:size-16">
              <GraduationCap size={29} aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[16px] py-1 font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t(locale, "studentProfile")}
              </p>
              <h2 className="break-words text-xl font-bold tracking-tight text-foreground sm:text-2xl [overflow-wrap:anywhere]">
                {student.name}
              </h2>

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-[16px] py-1 font-medium text-muted-foreground">
                  <Fingerprint size={13} aria-hidden="true" />
                  <span className="break-all">
                    {t(locale, "studentLoginId")}: {student.loginId}
                  </span>
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[16px] py-1 font-semibold ${passwordStatus.className}`}
                >
                  <PasswordStatusIcon size={13} aria-hidden="true" />
                  {passwordStatus.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5 md:max-w-52">
            <ShieldCheck
              size={17}
              className="shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-[16px] py-1 leading-5 text-muted-foreground">
              {t(locale, "supervisorAccountManagement")}
            </p>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="flex items-start gap-3 border-b border-border/70 p-5 sm:p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <UserRound size={19} aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <h2 className="font-bold tracking-tight text-foreground">
                  {t(locale, "studentAccountDetails")}
                </h2>
                <p className="mt-1 text-lg py-1 leading-5 text-muted-foreground">
                  {t(locale, "studentAccountDetailsDescription")}
                </p>
              </div>
            </div>

            <dl className="grid min-w-0 gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <DetailItem
                label={t(locale, "studentFullName")}
                value={student.name}
                icon={UserRound}
                description={t(locale, "studentDisplayNameDescription")}
              />
              <DetailItem
                label={t(locale, "studentCollegeId")}
                value={student.collegeId ?? t(locale, "notProvided")}
                icon={GraduationCap}
                description={t(locale, "studentCollegeIdDescription")}
              />
              <DetailItem
                label={t(locale, "studentLoginIdLabel")}
                value={student.loginId}
                icon={Fingerprint}
                description={t(locale, "studentLoginIdDescription")}
              />
              <DetailItem
                label={t(locale, "studentEmailAddress")}
                value={student.email ?? t(locale, "notProvided")}
                icon={Mail}
                description={t(locale, "studentEmailDescription")}
              />
              <DetailItem
                label={t(locale, "studentAccountCreated")}
                value={formatDate(student.createdAt)}
                icon={CalendarDays}
                description={t(locale, "studentAccountCreatedDescription")}
              />

              <div className="flex min-w-0 gap-3 rounded-xl border border-border/60 bg-background/50 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <LockKeyhole size={17} aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  <dt className="text-[16px] py-1 font-medium text-muted-foreground">
                    {t(locale, "studentPasswordSetup")}
                  </dt>
                  <dd className="text-lg py-1 font-semibold leading-5 text-foreground">
                    {passwordStatus.label}
                  </dd>
                  <p className="text-[16px] py-1 leading-5 text-muted-foreground">
                    {passwordStatus.description}
                  </p>
                </div>
              </div>
            </dl>

            <div className="flex items-start gap-2.5 border-t border-border/70 bg-muted/20 px-5 py-4">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-[16px] py-1 leading-5 text-muted-foreground">
                {t(locale, "studentAccountEditableFieldsNote")}
              </p>
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="flex items-start gap-3 p-5 sm:p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <KeyRound size={19} aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <h2 className="font-bold tracking-tight text-foreground">
                  {t(locale, "resetStudentPasswordTitle")}
                </h2>
                <p className="mt-1 text-lg py-1 leading-5 text-muted-foreground">
                  {t(locale, "resetStudentPasswordDescription")}
                </p>
              </div>
            </div>

            <div className="space-y-5 border-t border-border/70 p-5 sm:p-6">
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p className="text-[16px] py-1 leading-5 text-muted-foreground">
                  {t(locale, "studentTemporaryPasswordSecurityNote")}
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-5">
                <FormField
                  label={t(locale, "studentNewTemporaryPassword")}
                  name="password"
                  hint={t(locale, "studentTemporaryPasswordHint")}
                >
                  <TextInput
                    name="password"
                    type="password"
                    required
                    minLength={9}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder={t(locale, "studentTemporaryPasswordPlaceholder")}
                    disabled={isResetting || isDeleting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </FormField>

                <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[16px] py-1 leading-5 text-muted-foreground">
                    {t(locale, "studentPasswordResetServerNote")}
                  </p>
                  <ConfirmDialog
                  onCertain={()=>handlePasswordReset()}
                  style="warn"
                  title={t(locale, "confirmStudentPasswordReset")}
                  triggerChildren={<div 
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-lg py-1 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                  >{isResetting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      {t(locale, "studentPasswordResetting")}
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} aria-hidden="true" />
                      {t(locale, "studentResetPasswordButton")}
                    </>
                  )}</div>}
                  />
                </div>
              </form>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-destructive/25 bg-card shadow-sm">
            <div className="flex items-start gap-3 border-b border-destructive/15 bg-destructive/5 p-5 sm:p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert size={19} aria-hidden="true" />
              </span>

              <div className="min-w-0">
                <h2 className="font-bold tracking-tight text-foreground">
                  {t(locale, "studentDangerZone")}
                </h2>
                <p className="mt-1 text-lg py-1 leading-5 text-muted-foreground">
                  {t(locale, "studentDangerZoneDescription")}
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="space-y-2">
                <h3 className="text-lg py-1 font-semibold text-foreground">
                  {t(locale, "deleteStudentAccountTitle")}
                </h3>
                <p className="text-lg py-1 leading-6 text-muted-foreground">
                  {t(locale, "deleteStudentAccountDescription")}
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <CircleAlert
                  size={16}
                  className="mt-0.5 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                <p className="text-[16px] py-1 leading-5 text-muted-foreground">
                  {t(locale, "studentDeleteWarning")}
                </p>
              </div>
              <ConfirmDialog
                title={t(locale, "deleteStudentConfirm")}
                style="danger"
                onCertain={() =>
                  handleDeleteStudent()
                }
                triggerChildren={<div
                  className="btn w-full inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-lg py-1 font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:pointer-events-none disabled:opacity-60"
                >
                  {
                    isDeleting ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                        {t(locale, "studentDeletingAccount")}
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} aria-hidden="true" />
                        {t(locale, "deleteStudentAccountButton")}
                      </>
                    )}
                </div>
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <ShieldCheck
                size={17}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="text-lg py-1 font-bold text-foreground">
                {t(locale, "studentAccountManagementGuidance")}
              </h2>
            </div>

            <ul className="mt-4 space-y-3 text-[16px] py-1 leading-5 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>{t(locale, "studentGuidancePasswordReset")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>{t(locale, "studentGuidanceVerifyIdentity")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>{t(locale, "studentGuidanceReturnToDirectory")}</span>
              </li>
            </ul>

            <Button
              variant="outline"
              className="mt-5 min-h-10 w-full justify-center gap-2 rounded-xl"
            >
              <Link href="/supervisor/students" className="flex items-center gap-2">
                <ArrowLeft size={16} aria-hidden="true" />
                {t(locale, "backToStudentsDirectory")}
              </Link>
            </Button>
          </section>
        </aside>
      </div>
    </main>
  );
}