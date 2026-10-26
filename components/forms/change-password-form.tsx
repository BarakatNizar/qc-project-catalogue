// components/auth/change-password-form.tsx (or your respective path)
"use client";

import { useState, useTransition } from "react";
import { LockKeyhole, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { changePasswordAction } from "@/Interfaces/actions/auth.actions";
import { Button } from "@/components/ui/button";
import type { ChangePasswordPayload } from "@/shared/validation/user";

export function ChangePasswordForm({ initialPassword }: { initialPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const payload: ChangePasswordPayload = {
      currentPassword,
      newPassword,
      confirmPassword,
    };

    startTransition(async () => {
      const res = await changePasswordAction(payload);
      if (res && res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive backdrop-blur-md animate-in fade-in slide-in-from-top-1"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Current Password Input */}
      <div className="space-y-1.5">
        <label htmlFor="currentPassword" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Current password
        </label>
        <div className="relative flex items-center rounded-xl border border-border/70 bg-background/50 backdrop-blur-md transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <LockKeyhole size={17} className="absolute left-3.5 text-muted-foreground/70" />
          <input
            id="currentPassword"
            name="currentPassword"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="Enter current password"
            className="w-full bg-transparent py-2.5 pl-10 pr-11 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((prev) => !prev)}
            className="absolute right-2 flex size-8 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* New Password Input */}
      <div className="space-y-1.5">
        <label htmlFor="newPassword" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          New password
        </label>
        <div className="relative flex items-center rounded-xl border border-border/70 bg-background/50 backdrop-blur-md transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <LockKeyhole size={17} className="absolute left-3.5 text-muted-foreground/70" />
          <input
            id="newPassword"
            name="newPassword"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={9}
            maxLength={128}
            required
            placeholder="Enter new password"
            className="w-full bg-transparent py-2.5 pl-10 pr-11 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={() => setShowNew((prev) => !prev)}
            className="absolute right-2 flex size-8 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">At least 9 characters.</p>
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Confirm new password
        </label>
        <div className="relative flex items-center rounded-xl border border-border/70 bg-background/50 backdrop-blur-md transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <LockKeyhole size={17} className="absolute left-3.5 text-muted-foreground/70" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={9}
            maxLength={128}
            required
            placeholder="Confirm new password"
            className="w-full bg-transparent py-2.5 pl-10 pr-11 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((prev) => !prev)}
            className="absolute right-2 flex size-8 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* First Sign-in Notice */}
      {initialPassword && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs leading-relaxed text-foreground backdrop-blur-sm">
          <LockKeyhole size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>This is your first sign-in. Set a new password before using the rest of QC.</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Updating password...
          </span>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}