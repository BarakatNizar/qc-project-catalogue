"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound, Loader2 } from "lucide-react";
import { loginAction } from "@/Interfaces/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { notify } from "../notificationToaster";
import { LoginPayload } from "@/shared/validation/user";
import { useRouter } from "next/navigation";


export function LoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);

  const [pending, setPending] = useState(false);

  const handleLogin=async ()=>{
    if (!loginId){
      notify.system("Insert Your Login Id");
      return;
    }else if (!password){
      notify.system("Insert Your Password");
      return;
    }
    try {
      setPending(true);
      const toastId= notify.loading("Logging in...");
      const payload:LoginPayload={
        loginId,password
      }
      const loggedIn = await loginAction(payload);
      notify.dismiss(toastId);
      if ("error" in loggedIn){
        notify.error("Error",loggedIn.error)
      }else {
        notify.success("Welcome Sir!");
        router.replace(loggedIn.redirect);
      }
    } catch (error) {
      notify.error("Network Error");
      console.error(error)
    }finally{
      setPending(false);
    }
  }

  return (
    <section  className="mt-6 space-y-4">
      {/* Login ID Input */}
      <div className="space-y-1.5">
        <label htmlFor="loginId" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Login ID
        </label>
        <div className="relative flex items-center rounded-xl border border-border/70 bg-background/50 backdrop-blur-md transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <UserRound size={17} className="absolute left-3.5 text-muted-foreground/70" />
          <input
            id="loginId"
            name="loginId"
            value={loginId??""}
            onChange={(e)=>setLoginId(e.target.value)}
            type="text"
            autoComplete="username"
            required
            autoFocus
            placeholder="Enter your login ID"
            className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Password
        </label>
        <div className="relative flex items-center rounded-xl border border-border/70 bg-background/50 backdrop-blur-md transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <LockKeyhole size={17} className="absolute left-3.5 text-muted-foreground/70" />
          <input
            id="password"
            name="password"
            value={password??""}
            onChange={(e)=>setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="w-full bg-transparent py-2.5 pl-10 pr-11 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 flex size-8 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={pending}
        onClick={()=>handleLogin()}
        className="mt-2 w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Signing in...
          </span>
        ) : (
          "Sign in"
        )}
      </Button>
    </section>
  );
}