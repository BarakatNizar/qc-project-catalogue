
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Compass, LockKeyhole, ShieldCheck } from "lucide-react";

import { getServerUserFromAccess, roleHome } from "@/core/auth/session";
import { LoginForm } from "@/components/forms/login-form";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";
import { t } from "@/shared/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentApplicationLanguage();

  return {
    title: t(locale, "loginPageMetadataTitle"),
  };
}

export default async function LoginPage() {
  const getResult = await getServerUserFromAccess();
  const user = !("error" in getResult) ? getResult : undefined;
  const locale = await getCurrentApplicationLanguage();

  if (user) {
    redirect(
      user.mustChangePassword
        ? "/change-password"
        : roleHome(user.role),
    );
  }

  return (
    <div className="relative isolate min-h-[calc(100svh-160px)] overflow-hidden bg-background px-4 sm:px-6 lg:px-8">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 start-1/2 -z-10 h-[32rem] w-[48rem] max-w-[140vw] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.16] [mask-image:radial-gradient(ellipse_at_center,#000_0%,transparent_75%)]"
      />

      <div className="page-shell grid min-h-[calc(100svh-160px)] items-center gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:gap-14 lg:py-16 xl:gap-20">
        {/* Compact branding for mobile and tablet */}
        <div className="mx-auto w-full max-w-md lg:hidden">
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Compass size={23} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-wide text-foreground">
                Qalamoon Compass
              </p>
              <p className="text-xs text-muted-foreground">
                {t(locale, "loginAcademicDiscoveryLabel")}
              </p>
            </div>
          </div>

          <h1 className="mt-6 max-w-md text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {t(locale, "loginBrandHeadline")}{" "}
            <span className="text-primary">
              {t(locale, "loginBrandHeadlineHighlight")}
            </span>
          </h1>
        </div>

        {/* Desktop brand introduction */}
        <section className="hidden space-y-7 lg:block">
          <div className="relative inline-grid size-[4.5rem] place-items-center rounded-[1.4rem] bg-primary text-primary-foreground shadow-xl shadow-primary/20">
            <Compass
              size={34}
              strokeWidth={1.8}
              className="transition-transform duration-500 hover:rotate-12 motion-reduce:transition-none"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-[1.4rem] ring-1 ring-inset ring-white/20"
            />
          </div>

          <div className="space-y-4">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Qalamoon Compass
            </p>

            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.12] tracking-tight xl:text-5xl">
              {t(locale, "loginBrandHeadline")}{" "}
              <span className="text-primary">
                {t(locale, "loginBrandHeadlineHighlight")}
              </span>
            </h1>

            <p className="max-w-lg text-base leading-7 text-muted-foreground">
              {t(locale, "loginBrandDescription")}
            </p>
          </div>

          <div className="flex max-w-lg items-start gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck size={20} />
            </span>

            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-foreground">
                {t(locale, "loginManagedAccessTitle")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t(locale, "loginManagedAccessDescription")}
              </p>
            </div>
          </div>
        </section>

        {/* Login card */}
        <section
          aria-labelledby="login-heading"
          className="relative mx-auto w-full max-w-md"
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

            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    {t(locale, "loginWelcomeBack")}
                  </p>

                  <h2
                    id="login-heading"
                    className="mt-2 text-2xl font-extrabold tracking-tight text-foreground"
                  >
                    {t(locale, "loginSignInToQc")}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(locale, "loginCredentialsDescription")}
                  </p>
                </div>

                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                  <LockKeyhole size={20} />
                </span>
              </div>

              <LoginForm locale={locale} />
            </div>

            <div className="mt-6 border-t border-border/70 pt-5">
              <p className="text-center text-xs leading-5 text-muted-foreground sm:text-[13px]">
                {t(locale, "loginNoPublicRegistration")}
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground/80">
            Qalamoon Compass
          </p>
        </section>
      </div>
    </div>
  );
}
