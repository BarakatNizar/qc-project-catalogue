
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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserDto | null>(null);
  const [saving, setSaving] = useState(false);

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
          setError("Unable to load your profile. Please try again.");
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
  }, []);

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
        notify.error("Failed to update profile", res.error);
        return;
      }

      notify.success(
        "Profile saved",
        "Your personal information has been updated successfully.",
      );

      try {
        const updated = await getProfileAction();

        if ("error" in updated) {
          notify.warning(
            "Profile saved",
            "Your changes were saved, but the displayed profile could not be refreshed. Reload the page to see the latest details.",
          );
        } else {
          setProfile(updated);
        }
      } catch (refreshError) {
        console.error("Failed to refresh profile:", refreshError);

        notify.warning(
          "Profile saved",
          "Your changes were saved, but the displayed profile could not be refreshed. Reload the page to see the latest details.",
        );
      }
    } catch (updateError) {
      console.error("Failed to update profile:", updateError);

      notify.error(
        "Failed to update profile",
        "Something went wrong while saving your changes. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading profile"
        className="page-shell flex min-h-[24rem] items-center justify-center px-4 py-12"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <Loader2 size={26} className="animate-spin motion-reduce:animate-none" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Loading your profile
            </p>
            <p className="text-xs text-muted-foreground">
              Retrieving your account information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-shell px-4 py-10 sm:py-14">
        <ErrorState message={error || "Profile not found."} />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-6xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-12 lg:px-8">
      <PageHeading
        eyebrow="Account settings"
        title="Your profile"
        description="Manage your personal information and account security. Your login ID, account role, and student College ID are managed by QC and cannot be edited here."
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
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Account overview
              </p>
              <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                {profile.name}
              </h2>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {profile.email || "No email address added"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-foreground">
              <ShieldCheck size={14} className="text-primary" />
              {profile.role.toLowerCase()}
            </span>

            {profile.role === "STUDENT" && profile.collegeId && (
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 font-mono text-xs text-muted-foreground">
                <span className="shrink-0">College ID</span>
                <span className="break-all font-semibold text-foreground">
                  {profile.collegeId}
                </span>
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(250px,300px)] lg:items-start">
        {/* Personal information */}
        <section className="min-w-0 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
          <div className="flex items-start gap-3 border-b border-border/70 p-5 sm:p-7">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <UserRound size={21} />
            </span>

            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Personal information
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Keep your display name and contact details up to date.
                These details help identify your account across QC.
              </p>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            {/* Managed account identifiers */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Managed account details
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  These identifiers are maintained by your institution.
                  Contact your administrator or supervisor if they need to
                  be corrected.
                </p>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-border/70 bg-background/60 p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">
                    Login ID
                  </dt>
                  <dd className="mt-2 break-all font-mono text-sm font-medium text-foreground">
                    {profile.loginId}
                  </dd>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Used to sign in to your account.
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-border/70 bg-background/60 p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">
                    Account role
                  </dt>
                  <dd className="mt-2 break-words text-sm font-semibold capitalize text-foreground">
                    {profile.role.toLowerCase()}
                  </dd>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Determines your available areas and permissions.
                  </p>
                </div>

                {profile.role === "STUDENT" && (
                  <div className="min-w-0 rounded-2xl border border-border/70 bg-background/60 p-4 sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground">
                      College ID
                    </dt>
                    <dd className="mt-2 break-all font-mono text-sm font-semibold text-foreground">
                      {profile.collegeId || "Not provided"}
                    </dd>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Your institutional student identifier. It cannot be
                      changed from this page.
                    </p>
                  </div>
                )}
              </dl>
            </div>

            <div className="border-t border-border/70" />

            {/* Editable fields */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                Editable details
              </h3>
              <p className="text-xs leading-5 text-muted-foreground">
                Update your name and optional email address below. Your
                changes are saved to your QC profile when you select Save
                profile.
              </p>
            </div>

            <form
              key={`${profile.name}:${profile.email ?? ""}`}
              onSubmit={handleUpdateProfile}
              aria-busy={saving}
              className="space-y-5"
            >
              <FormField
                label="Full name"
                name="name"
                hint="Use the name you want displayed throughout QC."
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
                label="Email (optional)"
                name="email"
                hint="Add an email address if you want it associated with your account. Leave blank if you prefer not to provide one."
              >
                <div className="relative">
                  <Mail
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <TextInput
                    name="email"
                    type="email"
                    defaultValue={profile.email ?? ""}
                    autoComplete="email"
                    disabled={saving}
                    placeholder="you@example.com"
                    className="ps-10"
                  />
                </div>
              </FormField>

              <div className="flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <Info
                    size={15}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Login ID and account role cannot be edited here.
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} aria-hidden="true" />
                      Save profile
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

              <h2 className="mt-4 text-lg font-bold tracking-tight text-foreground">
                Password and access
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Keep your account secure by choosing a strong, unique
                password. Change it whenever you need to update your
                credentials.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <LockKeyhole size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Password management
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Your current password is required to confirm a password
                    change.
                  </p>
                </div>
              </div>

              <Link
                href="/change-password"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <KeyRound size={16} aria-hidden="true" />
                Change password
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
                <h3 className="text-sm font-semibold text-foreground">
                  Institution-managed account
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  QC does not support public registration. For changes to
                  your login ID, role, College ID, or other institution-
                  managed account details, contact your QC administrator
                  or supervisor.
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
              <p className="text-xs leading-5 text-muted-foreground">
                Review your details before saving. Your profile information
                should remain accurate so other authorized QC users can
                identify you correctly.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
