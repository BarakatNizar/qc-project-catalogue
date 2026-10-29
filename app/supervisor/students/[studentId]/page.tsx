
"use client";

import { useState, useEffect, use } from "react";
import type { FormEvent } from "react";
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
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="break-words text-sm font-semibold leading-5 text-foreground [overflow-wrap:anywhere]">
          {value}
        </dd>
        {description ? (
          <p className="break-words text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col justify-center gap-6 px-1"
    >
      <span className="sr-only">Loading student account details…</span>

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<UserDto | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
          setError("Unable to load this student account. Please try again.");
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
  }, [studentId]);

  const handlePasswordReset = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!student || isResetting || isDeleting) return;

    // Capture the form before awaiting; currentTarget is event-scoped.
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload: ResetStudentPasswordPayload = {
      studentId: student.id,
      data: {
        password: String(formData.get("password") ?? ""),
      },
    };

    setIsResetting(true);

    try {
      const result = await passwordResetStudentAction(payload);

      if ("error" in result) {
        notify.error("Password reset failed", result.error);
        return;
      }

      notify.success(
        "Password reset successfully",
        "A new temporary password has been assigned.",
      );

      form.reset();
    } catch {
      notify.error(
        "Password reset failed",
        "An unexpected error occurred. Please try again.",
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
        notify.error("Failed to delete student", result.error);
        return;
      }

      notify.success(
        "Student account deleted",
        "Redirecting to the students directory...",
      );

      router.push("/supervisor/students");
    } catch {
      notify.error(
        "Failed to delete student",
        "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !student) {
    return <ErrorState message={error || "Student not found."} />;
  }

  const passwordStatus = student.mustChangePassword
    ? {
        label: "Change required",
        description: "The student must change their password at sign-in.",
        icon: CircleAlert,
        className:
          "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      }
    : {
        label: "No change required",
        description: "No initial password change is currently required.",
        icon: CheckCircle2,
        className:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };

  const PasswordStatusIcon = passwordStatus.icon;

  return (
    <main className="mx-auto w-full min-w-0 space-y-6 pb-8">
      <PageHeading
        eyebrow="Student account"
        title={student.name}
        description="Review the student's account information, help restore account access, or manage account removal."
        action={
          <Link
            href="/supervisor/students"
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Students</span>
          </Link>
        }
      />

      <section
        aria-label="Student identity"
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
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Student profile
              </p>
              <h2 className="break-words text-xl font-bold tracking-tight text-foreground sm:text-2xl [overflow-wrap:anywhere]">
                {student.name}
              </h2>

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Fingerprint size={13} aria-hidden="true" />
                  <span className="break-all">
                    Login ID: {student.loginId}
                  </span>
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${passwordStatus.className}`}
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
            <p className="text-xs leading-5 text-muted-foreground">
              Supervisor account management
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
                  Account details
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Reference information associated with this student account.
                </p>
              </div>
            </div>

            <dl className="grid min-w-0 gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <DetailItem
                label="Full name"
                value={student.name}
                icon={UserRound}
                description="The student's current display name."
              />
              <DetailItem
                label="College ID"
                value={student.collegeId ?? "Not provided"}
                icon={GraduationCap}
                description="The college identifier recorded for this account."
              />
              <DetailItem
                label="Login ID"
                value={student.loginId}
                icon={Fingerprint}
                description="The identifier used to sign in."
              />
              <DetailItem
                label="Email address"
                value={student.email ?? "Not provided"}
                icon={Mail}
                description="An email address associated with the account, if provided."
              />
              <DetailItem
                label="Account created"
                value={formatDate(student.createdAt)}
                icon={CalendarDays}
                description="The account creation date."
              />

              <div className="flex min-w-0 gap-3 rounded-xl border border-border/60 bg-background/50 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <LockKeyhole size={17} aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Password setup
                  </dt>
                  <dd className="text-sm font-semibold leading-5 text-foreground">
                    {passwordStatus.label}
                  </dd>
                  <p className="text-xs leading-5 text-muted-foreground">
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
              <p className="text-xs leading-5 text-muted-foreground">
                Students manage their own display name, email, and password.
                Their college ID remains fixed.
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
                  Reset student password
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Assign a new temporary password if the student cannot access
                  their account.
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
                <p className="text-xs leading-5 text-muted-foreground">
                  Share the temporary password with the student through a
                  secure channel. Do not share credentials in public messages.
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-5">
                <FormField
                  label="New temporary password"
                  name="password"
                  hint="Use at least 9 characters. Maximum length: 128 characters."
                >
                  <TextInput
                    name="password"
                    type="password"
                    required
                    minLength={9}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="Enter a temporary password"
                    disabled={isResetting || isDeleting}
                  />
                </FormField>

                <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted-foreground">
                    The reset takes effect only if the server action succeeds.
                  </p>

                  <ConfirmSubmitButton
                    type="submit"
                    disabled={isResetting || isDeleting}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                    confirmMessage="Are you sure you want to reset this student's password?"
                  >
                    {isResetting ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                        Resetting…
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} aria-hidden="true" />
                        Reset password
                      </>
                    )}
                  </ConfirmSubmitButton>
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
                  Danger zone
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Actions that permanently affect this account.
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Delete student account
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Permanently removes the student's account. Shared project
                  and AI suggestion history remains intact.
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <CircleAlert
                  size={16}
                  className="mt-0.5 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  This operation is destructive and should only be used when
                  account removal is intended.
                </p>
              </div>

              <ConfirmSubmitButton
                onClick={handleDeleteStudent}
                disabled={isDeleting || isResetting}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:pointer-events-none disabled:opacity-60"
                confirmMessage="Permanently delete this student account? Shared project and AI suggestion history will remain."
              >
                {isDeleting ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                    Deleting account…
                  </>
                ) : (
                  <>
                    <Trash2 size={16} aria-hidden="true" />
                    Delete student account
                  </>
                )}
              </ConfirmSubmitButton>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-muted/20 p-5 sm:p-6">
            <div className="flex items-center gap-2.5">
              <ShieldCheck
                size={17}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="text-sm font-bold text-foreground">
                Account management guidance
              </h2>
            </div>

            <ul className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>
                  Use a password reset to restore access without removing the
                  account.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>
                  Verify the student's identity before sharing temporary
                  credentials.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>
                  Return to the students directory to manage another account.
                </span>
              </li>
            </ul>

            <Button
              variant="outline"
              className="mt-5 min-h-10 w-full justify-center gap-2 rounded-xl"
            >
              <Link href="/supervisor/students">
                <ArrowLeft size={16} aria-hidden="true" />
                Back to students
              </Link>
            </Button>
          </section>
        </aside>
      </div>
    </main>
  );
}
