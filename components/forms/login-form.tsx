
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

export function LoginForm() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pending) return;

    if (!loginId.trim()) {
      notify.system("Insert Your Login Id");
      return;
    }

    if (!password) {
      notify.system("Insert Your Password");
      return;
    }

    let toastId: string | number | undefined;

    try {
      setPending(true);
      toastId = notify.loading("Logging in...");

      const payload: LoginPayload = {
        loginId,
        password,
      };

      const loggedIn = await loginAction(payload);

      if ("error" in loggedIn) {
        notify.error("Error", loggedIn.error);
        return;
      }

      notify.success("Welcome Sir!");
      router.replace(loggedIn.redirect);
    } catch (error) {
      notify.error("Network Error");
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
          <CardTitle>Quick Fill-In</CardTitle>
        </CardHeader>
        <CardContent className="space-x-4">
          <button className="btn btn-sm btn-primary"
          onClick={()=>{
            setLoginId("admin");
            setPassword("adminadmin12")
          }}>
            Admin
            </button>
          <button className="btn btn-sm btn-primary"
          onClick={()=>{
            setLoginId("123456789");
            setPassword("123456789")
          }}>
            Supervisor
          </button>
          <button className="btn btn-sm btn-primary"
          onClick={()=>{
            setLoginId("987654321");
            setPassword("987654321")
          }}>
            Student
          </button>
        </CardContent>
      </Card>

      {/* Login ID */}
      <div className="space-y-2">
        <label
          htmlFor="loginId"
          className="block text-xs font-semibold tracking-wide text-foreground"
        >
          Login ID
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
            placeholder="Enter your login ID"
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
          Password
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
            placeholder="Enter your password"
            className="min-w-0 w-full bg-transparent py-3 ps-10 pe-12 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={pending}
            aria-label={showPassword ? "Hide password" : "Show password"}
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
            <span>Signing in...</span>
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
