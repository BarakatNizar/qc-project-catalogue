// app/admin/supervisors/[supervisorId]/page.tsx (or your respective path)
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { notify } from "@/components/notificationToaster";
import ErrorState from "@/components/ErrorState";
import { PageHeading } from "@/components/ui/page-heading";
import { FormField, TextInput } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { UserDto } from "@/modules/user/mappers/user-mapper";
import { getSupervisorAction } from "@/Interfaces/getters/user.getters";
import { ResetSupervisorPasswordPayload, UpdateSupervisorPayload } from "@/shared/validation/user";
import { deleteSupervisorAction, passwordResetSupervisorAction, updateSupervisorAction } from "@/Interfaces/actions/users.actions";

export default function SupervisorAccountPage({
  params,
}: {
  params: Promise<{ supervisorId: string }>;
}) {
  const { supervisorId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supervisor, setSupervisor] = useState<UserDto | null>(null);

  // Load supervisor details on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getSupervisorAction(supervisorId);
      if ("error" in res) {
        setError(res.error);
      } else {
        setSupervisor(res);
      }
      setLoading(false);
    }
    loadData();
  }, [supervisorId]);

  // Handle Update Supervisor Info
  const handleUpdateSupervisor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supervisor) return;

    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email");
    const payload: UpdateSupervisorPayload = {
      supervisorId: supervisor.id,
      data: {
        name: String(formData.get("name") ?? ""),
        email: emailValue ? String(emailValue) : undefined,
      },
    };

    const res = await updateSupervisorAction(payload);
    if ("error" in res) {
      notify.error("Failed to update supervisor", res.error);
    } else {
      notify.success("Supervisor details updated successfully", "Changes have been saved.");
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supervisor) return;

    const formData = new FormData(e.currentTarget);
    const payload: ResetSupervisorPasswordPayload = {
      supervisorId: supervisor.id,
      data: {
        password: String(formData.get("password") ?? ""),
      },
    };

    const res = await passwordResetSupervisorAction(payload);
    if ("error" in res) {
      notify.error("Password reset failed", res.error);
    } else {
      notify.success("Password reset successfully", "A new temporary password has been assigned.");
      // e.currentTarget.reset();
    }
  };

  // Handle Delete Supervisor
  const handleDeleteSupervisor = async () => {
    if (!supervisor) return;

    const res = await deleteSupervisorAction(supervisor.id);
    if ("error" in res) {
      notify.error("Failed to delete supervisor", res.error);
    } else {
      notify.success("Supervisor account removed", "Redirecting to supervisors directory...");
      router.push("/admin/supervisors");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !supervisor) {
    return <ErrorState message={error || "Supervisor not found."} />;
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Supervisor account"
        title="Edit Supervisor"
        description="Update display details or reset credentials. The login ID remains stable."
        action={
          <Button variant="ghost" className="rounded-xl gap-2" >
            <Link href="/admin/supervisors" className="flex gap-2 items-center hover:gap-4 duration-200">
              <ArrowLeft size={16} /> Back to directory
            </Link>
          </Button>
        }
      />

      <div className="w-full grid lg:grid-cols-2 gap-6">
        {/* Edit Supervisor Info Section */}
        <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">Account details</h2>
            <p className="text-xs text-muted-foreground">Update the supervisor's name and contact email.</p>
          </div>

          <form onSubmit={handleUpdateSupervisor} className="space-y-5">
            <div className="space-y-1.5">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Login ID</p>
              <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 font-mono text-sm text-muted-foreground backdrop-blur-sm">
                {supervisor.loginId}
              </div>
            </div>

            <FormField label="Full name" name="name">
              <TextInput name="name" required defaultValue={supervisor.name} />
            </FormField>

            <FormField label="Email (optional)" name="email">
              <TextInput name="email" type="email" defaultValue={supervisor.email ?? ""} />
            </FormField>

            <Button type="submit" className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/20">
              Save changes
            </Button>
          </form>
        </section>

        {/* Password Reset Section */}
        <section className="rounded-[2rem] border border-white/10 bg-card/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">Reset password</h2>
            <p className="text-xs text-muted-foreground">Assign a new temporary password for this supervisor account.</p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-5">
            <FormField
              label="New temporary password"
              name="password"
              hint="At least 9 characters. Share securely with the supervisor."
            >
              <TextInput
                name="password"
                type="password"
                required
                minLength={9}
                maxLength={128}
                autoComplete="new-password"
                placeholder="••••••••••••"
              />
            </FormField>

            <ConfirmSubmitButton
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-destructive px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:bg-destructive/90"
              confirmMessage="Are you sure you want to reset this supervisor's password?"
            >
              Reset password
            </ConfirmSubmitButton>
          </form>
        </section>
      </div>

      {/* Account Actions / Delete Section */}
      <aside className="rounded-[2rem] border border-white/10 bg-card/80 p-6 backdrop-blur-xl shadow-xl h-fit space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldCheck size={18} />
          </span>
          <h2 className="font-bold tracking-tight">Danger zone</h2>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Permanently delete this Supervisor account. Associated students will remain and their supervisor association will be cleared.
        </p>

        <div className="pt-2">
          <ConfirmSubmitButton
            onClick={handleDeleteSupervisor}
            className="w-full rounded-xl border border-destructive/30 bg-destructive/10 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-1.5"
            confirmMessage="Permanently delete this Supervisor account? Associated students will remain."
          >
            <Trash2 size={15} /> Delete supervisor account
          </ConfirmSubmitButton>
        </div>
      </aside>
    </div>
  );
}