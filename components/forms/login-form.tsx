
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  Loader2,
} from "lucide-react";

import { loginAction } from "@/Interfaces/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { notify } from "../notificationToaster";
import type { LoginPayload } from "@/shared/validation/user";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { t, type Locale } from "@/shared/i18n/dictionary";

type Props = {
  locale: Locale;
};

export function LoginForm({ locale }: Props) {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pending) return;

    if (!loginId.trim()) {
      notify.system(t(locale, "loginMissingLoginId"));
      return;
    }

    if (!password) {
      notify.system(t(locale, "loginMissingPassword"));
      return;
    }

    let toastId: string | number | undefined;

    try {
      setPending(true);
      toastId = notify.loading(t(locale, "loginLoggingIn"));

      const payload: LoginPayload = {
        loginId,
        password,
      };

      const loggedIn = await loginAction(payload);

      if ("error" in loggedIn) {
        notify.error(t(locale, "loginErrorTitle"), loggedIn.error);
        return;
      }

      notify.success(t(locale, "loginWelcomeMessage"));
      router.replace(loggedIn.redirect);
    } catch (error) {
      notify.error(t(locale, "loginNetworkError"));
      console.error(error);
    } finally {
      if (toastId !== undefined) {
        notify.dismiss(toastId);
      }

      setPending(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      aria-busy={pending}
      className="space-y-5"
    >
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "loginQuickFillTitle")}</CardTitle>
        </CardHeader>

        <CardContent className="space-x-4">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => {
              setLoginId("admin");
              setPassword("adminadmin12");
            }}
          >
            {t(locale, "loginAdminDemo")}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => {
              setLoginId("123456789");
              setPassword("123456789");
            }}
          >
            {t(locale, "loginSupervisorDemo")}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => {
              setLoginId("987654321");
              setPassword("987654321");
            }}
          >
            {t(locale, "loginStudentDemo")}
          </button>
        </CardContent>
      </Card>

      {/* Login ID */}
      <div className="space-y-2">
        <label
          htmlFor="loginId"
          className="block text-xs font-semibold tracking-wide text-foreground"
        >
          {t(locale, "loginIdLabel")}
        </label>

        <div className="relative flex min-h-12 items-center rounded-xl border border-border bg-background transition-colors duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <UserRound
            aria-hidden="true"
            size={17}
            className="pointer-events-none absolute start-3.5 shrink-0 text-muted-foreground"
          />

          <input
            id="loginId"
            name="loginId"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            type="text"
            autoComplete="username"
            autoFocus
            required
            disabled={pending}
            placeholder={t(locale, "loginIdPlaceholder")}
            className="min-w-0 w-full bg-transparent py-3 ps-10 pe-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs font-semibold tracking-wide text-foreground"
        >
          {t(locale, "loginPasswordLabel")}
        </label>

        <div className="relative flex min-h-12 items-center rounded-xl border border-border bg-background transition-colors duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <LockKeyhole
            aria-hidden="true"
            size={17}
            className="pointer-events-none absolute start-3.5 shrink-0 text-muted-foreground"
          />

          <input
            id="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={pending}
            placeholder={t(locale, "loginPasswordPlaceholder")}
            className="min-w-0 w-full bg-transparent py-3 ps-10 pe-12 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={pending}
            aria-label={
              showPassword
                ? t(locale, "loginHidePassword")
                : t(locale, "loginShowPassword")
            }
            aria-pressed={showPassword}
            className="absolute end-2 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/15 transition-[transform,box-shadow] duration-200 hover:shadow-primary/25 active:scale-[0.99] motion-reduce:transition-none"
      >
        {pending ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            <span>{t(locale, "loginSigningIn")}</span>
          </>
        ) : (
          t(locale, "loginSignInButton")
        )}
      </Button>
    </form>
  );
}
