"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  onClick,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmMessage: string }) {
  return (
    <button
      {...props}
      type={props.type}
      className={cn(
        "cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }else onClick?.(event)
      }}
    >
      {children}
    </button>
  );
}