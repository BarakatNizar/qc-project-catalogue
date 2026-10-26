import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Compass, ShieldCheck, LockKeyhole } from "lucide-react";
import { getServerUserFromAccess, roleHome } from "@/core/auth/session";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  // const user = await getServerUserFromAccess();

  const getResult = (await getServerUserFromAccess());
  const user = !("error" in getResult) ? getResult : undefined;

  if (user) redirect(user.mustChangePassword ? "/change-password" : roleHome(user.role));

  return (
    <div className="relative isolate min-h-[calc(100vh-160px)] overflow-hidden bg-background  px-4 md:px-6 lg:px-8 xl:px-12">
      {/* Background Radial Glow & Ambient Mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent blur-3xl opacity-50"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      <div className="page-shell grid min-h-[calc(100vh-160px)] items-center gap-12 py-12 lg:grid-cols-[.02fr_1.16fr_.8fr_0.02fr]">
        {/* Left Side: Editorial & Value Proposition */}
        <div/>
        <div className="hidden lg:block space-y-5">
          <div className="relative inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-xl shadow-primary/25">
            <Compass size={32} className="transition-transform duration-500 hover:rotate-45" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 inset-ring" />
          </div>

          <div>
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-primary">
              Qalamoon Compass
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl/tight">
              A considered space for{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-emerald-400 bg-clip-text text-transparent">
                academic project ideas.
              </span>
            </h1>
          </div>

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground/90">
            Sign in with an account provisioned by your QC administrator or supervisor. Registration is managed directly by the institution.
          </p>

          <div className="inline-flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-2.5 backdrop-blur-md text-sm font-medium text-muted-foreground">
            <ShieldCheck size={18} className="text-primary shrink-0" />
            <span>Role-based access, managed accounts, and private credentials.</span>
          </div>
        
        </div>

        {/* Right Side: SpeedyJob Form Container Card */}
        <div className="relative mx-auto w-full max-w-xl">
          {/* Backlight Aura */}
          <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 opacity-70 blur-2xl" />

          <div className="relative rounded-[2.5rem] border border-white/10 bg-card/80 p-8 sm:p-10 backdrop-blur-xl shadow-2xl">
            <div className="mb-6 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-bold uppercase tracking-widest text-primary">
                  Welcome Back
                </p>
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <LockKeyhole size={18} />
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Sign in to QC</h2>
              <p className="text-sm text-muted-foreground">
                Use your login ID and password to continue.
              </p>
            </div>

            {/* Form Component */}
            <LoginForm />

            {/* Footer Notice */}
            <div className="mt-4 border-t border-border/50 pt-5 text-center">
              <p className="text-[13px] leading-relaxed text-muted-foreground/95">
                No public registration. Ask your QC administrator or supervisor for an account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}