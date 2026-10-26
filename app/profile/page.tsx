// app/profile/page.tsx (or your respective path)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { KeyRound, UserRound, ShieldCheck, Loader2 } from "lucide-react";
import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { FormField, TextInput } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { getProfileAction } from "@/Interfaces/getters/user.getters";
import { UserDto } from "@/modules/user/mappers/user-mapper";
import { UpdateProfilePayload } from "@/shared/validation/user";
import { updateProfileAction } from "@/Interfaces/actions/auth.actions";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserDto | null>(null);

  // Load profile details on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getProfileAction();
      if ("error" in res) {
        setError(res.error);
      } else {
        setProfile(res);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email");
    const payload: UpdateProfilePayload = {
      name: String(formData.get("name") ?? ""),
      email: emailValue ? String(emailValue) : null,
    };

    const res = await updateProfileAction(payload);
    if ("error" in res) {
      notify.error("Failed to update profile", res.error);
    } else {
      notify.success("Profile saved", "Your personal information has been updated successfully.");
      // Refresh profile data if needed
      const updated = await getProfileAction();
      if (!("error" in updated)) {
        setProfile(updated);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return <ErrorState message={error || "Profile not found."} />;
  }

  return (
    <div className="page-shell mx-auto max-w-6xl py-10 sm:py-14 space-y-8">
      <PageHeading
        eyebrow="Account settings"
        title="Your profile"
        description="Manage your personal display details and password. College ID is used for student login and cannot be changed here."
      />

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        {/* Personal Info Form */}
        <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <UserRound size={22} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Personal information</h2>
              <p className="text-xs text-muted-foreground">Your account ID and role are managed by QC.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="space-y-1.5">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Login ID</p>
              <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 font-mono text-sm text-muted-foreground backdrop-blur-sm">
                {profile.loginId}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Account role</p>
              <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 font-mono text-sm text-muted-foreground uppercase tracking-wider backdrop-blur-sm">
                {profile.role.toLowerCase()}
              </div>
            </div>

            {profile.role === "STUDENT" && (
              <div className="space-y-1.5">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">College ID</p>
                <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 font-mono text-sm text-foreground font-semibold backdrop-blur-sm">
                  {profile.collegeId}
                </div>
              </div>
            )}

            <FormField label="Full name" name="name">
              <TextInput name="name" required minLength={2} maxLength={160} defaultValue={profile.name} />
            </FormField>

            <FormField label="Email (optional)" name="email">
              <TextInput name="email" type="email" defaultValue={profile.email ?? ""} />
            </FormField>

            <Button type="submit" className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/20">
              Save profile
            </Button>
          </form>
        </section>

        {/* Password & Governance Sidebar */}
        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <KeyRound size={20} />
            </span>
            <div className="space-y-1">
              <h2 className="font-bold tracking-tight">Password and access</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Update your password whenever needed. Your session will remain private to this browser.
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full rounded-xl border-border/80 font-semibold">
              <Link href="/change-password">Change password</Link>
            </Button>
          </section>

          <div className="rounded-2xl border border-border/60 bg-card/50 p-4 text-[11px] leading-relaxed text-muted-foreground/80 backdrop-blur-sm flex items-start gap-2.5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
            <span>
              QC does not support public registration. Contact your administrator or supervisor for account changes outside your profile.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}