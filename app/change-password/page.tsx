
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { getServerUserFromAccess } from "@/core/auth/session";
import { ChangePasswordForm } from "@/components/forms/change-password-form";

export default async function ChangePasswordPage() {
  const getResult = await getServerUserFromAccess();
  const user = !("error" in getResult) ? getResult : undefined;

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="relative isolate min-h-[calc(100svh-160px)] overflow-hidden bg-background px-4 sm:px-6 lg:px-8">
      {/* Subtle ambient accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 start-1/2 -z-10 h-[28rem] w-[min(48rem,140vw)] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.12] [mask-image:radial-gradient(ellipse_at_center,#000_0%,transparent_75%)]"
      />

      <div className="page-shell flex min-h-[calc(100svh-160px)] items-center justify-center py-8 sm:py-12 lg:py-16">
        <section
          aria-labelledby="change-password-heading"
          className="relative w-full max-w-lg"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-primary/10 blur-2xl sm:-inset-5"
          />

          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xl shadow-black/[0.04] sm:p-8 lg:p-9">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"
            />

            <div className="space-y-6">
              {/* Heading */}
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:size-14">
                  <LockKeyhole size={25} strokeWidth={1.9} />
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary sm:text-xs">
                    Account security
                  </p>

                  <h1
                    id="change-password-heading"
                    className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl"
                  >
                    Change your password
                  </h1>
                </div>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                Choose a password unique to your QC account. Enter your
                current password to confirm the change.
              </p>

              {/* Security note */}
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5 sm:p-4">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p className="text-xs leading-5 text-muted-foreground sm:text-sm">
                  Your password protects access to your academic projects
                  and account information. Never share it with others.
                </p>
              </div>

              <ChangePasswordForm
                initialPassword={user.mustChangePassword}
              />

              <div className="border-t border-border/70 pt-5">
                <Link
                  href="/profile"
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:w-auto"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  <span>Back to profile</span>
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground/80">
            Qalamoon Compass
          </p>
        </section>
      </div>
    </main>
  );
}
