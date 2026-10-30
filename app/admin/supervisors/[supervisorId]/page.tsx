
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
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";

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

type SupervisorAccountPageProps = {
  params: Promise<{ supervisorId: string }>;
};

export default function SupervisorAccountPage({
  params,
}: SupervisorAccountPageProps) {
  const { supervisorId } = use(params);
  const router = useRouter();

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
          setError("Unable to load this supervisor account. Please try again.");
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
  }, [supervisorId]);

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
        notify.error("Failed to update supervisor", res.error);
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
        "Supervisor details updated successfully",
        "Changes have been saved.",
      );
    } catch {
      notify.error(
        "Failed to update supervisor",
        "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {

    if(!password){
      notify.system("Set New Password !");return;

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
        notify.error("Password reset failed", res.error);
        return;
      }

      notify.success(
        "Password reset successfully",
        "A new temporary password has been assigned.",
      );
    } catch {
      notify.error(
        "Password reset failed",
        "An unexpected error occurred. Please try again.",
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
        notify.error("Failed to delete supervisor", res.error);
        setIsDeleting(false);
        return;
      }

      notify.success(
        "Supervisor account removed",
        "Redirecting to supervisors directory...",
      );

      router.push("/admin/supervisors");
    } catch {
      notify.error(
        "Failed to delete supervisor",
        "An unexpected error occurred. Please try again.",
      );
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-7xl space-y-6"
        role="status"
        aria-label="Loading supervisor account"
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

        <span className="sr-only">Loading supervisor account details...</span>
      </div>
    );
  }

  if (error || !supervisor) {
    return <ErrorState message={error || "Supervisor not found."} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <PageHeading
        eyebrow="Supervisor account"
        title="Manage supervisor"
        description="Review account information, update contact details, or manage credentials and account access."
        action={
          <Link
            href="/admin/supervisors"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to directory
          </Link>
        }
      />

      {/* Supervisor identity */}
      <section
        aria-label="Supervisor identity"
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <ShieldCheck size={13} aria-hidden="true" />
                Supervisor account
              </span>
            </div>

            <h2 className="break-words text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {supervisor.name}
            </h2>

            <div className="flex min-w-0 flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
              <span className="inline-flex min-w-0 items-start gap-2">
                <Fingerprint
                  size={16}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="break-all font-mono text-xs sm:text-sm">
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
                Account details
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Update the supervisor&apos;s display name and optional contact
                email. The login ID remains unchanged.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Fingerprint
                size={17}
                className="mt-0.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Permanent login ID
                </p>
                <p className="break-all font-mono text-sm font-medium text-foreground">
                  {supervisor.loginId}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This identifier is read-only and cannot be edited on this
                  page.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateSupervisor} className="space-y-5">
            <FormField label="Full name" name="name">
              <TextInput
                name="name"
                required
                defaultValue={supervisor.name}
                autoComplete="name"
                placeholder="Enter the supervisor's full name"
              />
            </FormField>

            <FormField
              label="Email address"
              name="email"
              hint="Optional. Used as contact information if supported by your application."
            >
              <TextInput
                name="email"
                type="email"
                defaultValue={supervisor.email ?? ""}
                autoComplete="email"
                placeholder="supervisor@example.com"
              />
            </FormField>

            <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Save your changes when you&apos;re finished.
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
                    Saving changes...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} aria-hidden="true" />
                    Save changes
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
                Reset password
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Set a new temporary password for this supervisor. This
                operation changes credentials rather than profile information.
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
              <p className="text-sm font-semibold text-foreground">
                Handle temporary credentials securely
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Use a unique password and share it with the supervisor through
                a secure channel. Do not include passwords in ordinary messages
                or shared notes.
              </p>
            </div>
          </div>

          <section className="space-y-5">
            <FormField
              label="New temporary password"
              name="password"
              hint="Required. Use at least 9 characters; the maximum is 128."
            >
              <TextInput
                type="password"
                required
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                minLength={9}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Enter a temporary password"
              />
            </FormField>

            <div className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck
                size={15}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>
                Resetting the password affects this supervisor&apos;s
                credentials. Confirm the operation before submitting.
              </p>
            </div>

            <div className="border-t border-border/60 pt-5">
            <ConfirmDialog
              title="Are you sure you want to reset this supervisor's password?" style="warn" onCertain={() => handlePasswordReset()}
              triggerChildren={isResetting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Resetting password...
                </>
              ) : (
                <div className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:pointer-events-none disabled:opacity-60">
                  <KeyRound size={16} aria-hidden="true" />
                  Reset password
                </div>
              )} />
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
              Danger zone
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Permanently remove this supervisor account. This action should
              only be used when the account is no longer needed.
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
              <p className="text-sm font-semibold text-foreground">
                Delete supervisor account
              </p>
              <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                According to the existing behavior, associated students will
                remain in the system and their supervisor association will be
                cleared. The supervisor will be redirected to the directory
                after successful deletion.
              </p>
            </div>
          </div>

          <div className="w-full shrink-0 md:w-auto">
            <ConfirmDialog
              title="Permanently delete this Supervisor account?" style="danger" onCertain={() => handleDeleteSupervisor()}
              triggerChildren={isDeleting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Deleting account...
                </>
              ) : (
                <div className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-60 md:w-auto">
                  <Trash2 size={16} aria-hidden="true" />
                  Delete account
                </div>
              )} />
          </div>
        </div>
      </aside>
    </div>
  );
}
