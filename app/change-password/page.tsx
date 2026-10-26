import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { getServerUserFromAccess } from "@/core/auth/session";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { Button } from "@/components/ui/button";

export default async function ChangePasswordPage() {
  
  const getResult = (await getServerUserFromAccess());
  const user = !("error" in getResult) ? getResult : undefined;
  if (!user) redirect("/login");

  return (
    <div className="relative isolate min-h-[calc(100vh-160px)] overflow-hidden bg-background">
      {/* Background Ambient Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent blur-3xl opacity-50"
      />

      <div className="page-shell flex min-h-[calc(100vh-160px)] items-center justify-center py-12">
        <div className="relative w-full max-w-lg">
          {/* Outer Aura Backlight */}
          <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 opacity-70 blur-2xl" />

          <section className="relative rounded-[2.5rem] border border-white/10 bg-card/80 p-8 sm:p-10 backdrop-blur-xl shadow-2xl space-y-6">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <LockKeyhole size={28} />
            </span>

            <div className="space-y-1.5">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
                Account Security
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Change your password</h1>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Use a password that is unique to your QC account. Your existing password is required to confirm this change.
              </p>
            </div>

            <ChangePasswordForm initialPassword={user.mustChangePassword} />

            <div className="border-t border-border/50 pt-4 text-center">
              <Button  variant="ghost" size="sm" className="rounded-xl text-xs font-semibold">
                <Link href="/profile">Back to profile</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}