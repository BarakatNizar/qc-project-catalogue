
"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";

import { changePasswordAction } from "@/Interfaces/actions/auth.actions";
import { Button } from "@/components/ui/button";
import type { ChangePasswordPayload } from "@/shared/validation/user";

type ChangePasswordFormProps = {
  initialPassword: boolean;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  disabled: boolean;
  minLength?: number;
  maxLength?: number;
  hint?: string;
  hintId?: string;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
  placeholder,
  autoComplete,
  disabled,
  minLength,
  maxLength,
  hint,
  hintId,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-semibold tracking-wide text-foreground"
      >
        {label}
      </label>

      <div className="relative flex min-h-12 items-center rounded-xl border border-border bg-background transition-colors duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <LockKeyhole
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute start-3.5 shrink-0 text-muted-foreground"
        />

        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-describedby={hintId}
          className="min-w-0 w-full bg-transparent py-3 ps-10 pe-12 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute end-2 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {hint && (
        <p
          id={hintId}
          className="text-xs leading-5 text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function ChangePasswordForm({
  initialPassword,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pending) return;

    setError(null);

    const payload: ChangePasswordPayload = {
      currentPassword,
      newPassword,
      confirmPassword,
    };

    startTransition(async () => {
      try {
        const res = await changePasswordAction(payload);

        if (res && res.error) {
          setError(res.error);
        }
      } catch (err) {
        console.error("Change password request failed:", err);
        setError("Unable to update your password. Please try again.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={pending}
      className="space-y-5"
    >
      {/* Server or request error */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p className="min-w-0 flex-1 leading-5">{error}</p>
        </div>
      )}

      <PasswordField
        id="currentPassword"
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        visible={showCurrent}
        onToggleVisibility={() => setShowCurrent((value) => !value)}
        placeholder="Enter current password"
        autoComplete="current-password"
        disabled={pending}
      />

      <PasswordField
        id="newPassword"
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        visible={showNew}
        onToggleVisibility={() => setShowNew((value) => !value)}
        placeholder="Enter new password"
        autoComplete="new-password"
        minLength={9}
        maxLength={128}
        hint="Use at least 9 characters."
        hintId="newPassword-hint"
        disabled={pending}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        visible={showConfirm}
        onToggleVisibility={() => setShowConfirm((value) => !value)}
        placeholder="Confirm new password"
        autoComplete="new-password"
        minLength={9}
        maxLength={128}
        disabled={pending}
      />

      {/* First sign-in notice */}
      {initialPassword && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-3.5 sm:p-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <LockKeyhole size={17} aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              First sign-in
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
              Set a new password before using the rest of QC.
            </p>
          </div>
        </div>
      )}

      {/* Password confirmation feedback */}
      {confirmPassword.length > 0 && (
        <p
          className={
            newPassword === confirmPassword
              ? "flex items-center gap-2 text-xs font-medium text-success"
              : "text-xs leading-5 text-muted-foreground"
          }
          aria-live="polite"
        >
          {newPassword === confirmPassword ? (
            <>
              <Check size={14} aria-hidden="true" />
              Passwords match.
            </>
          ) : (
            "Make sure both new password fields match."
          )}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/15 transition-[transform,box-shadow] duration-200 hover:shadow-primary/25 active:scale-[0.99] motion-reduce:transition-none"
      >
        {pending ? (
          <>
            <Loader2
              size={17}
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span>Updating password...</span>
          </>
        ) : (
          <>
            <LockKeyhole size={16} aria-hidden="true" />
            <span>Update password</span>
          </>
        )}
      </Button>
    </form>
  );
}
