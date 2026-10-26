// src/components/ui/ErrorState.tsx
"use client";

import { AlertTriangle, RotateCw, ShieldX } from "lucide-react";

type ErrorStateProps = {
  message?: string;
  statusCode?: string | number;
  title?: string;
};

export default function ErrorState({
  message = "Unexpected server response.",
  statusCode = "500",
  title = "System Error",
}: ErrorStateProps) {
  return (
    <div className="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden rounded-[32px] border border-base-300 bg-base-100 p-6">
      
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#999_1px,transparent_1px),linear-gradient(to_bottom,#999_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="absolute left-0 top-0 h-1 w-full bg-error/70" />

      {/* Glow */}
      <div className="absolute h-[320px] w-[320px] rounded-full bg-error/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-xl">
        
        {/* Status Badge */}
        <div className="mb-5 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-error/20 bg-error/10 px-4 py-1.5 text-[13px] font-black uppercase tracking-[0.2em] text-error">
            <ShieldX size={18} />
            Error State
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-[28px] border border-base-300 bg-base-100/90 p-8 shadow-2xl backdrop-blur">
          
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              
              <div className="absolute inset-0 rounded-[28px] bg-error/20 blur-xl" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-error/30 bg-error/10 text-error shadow-lg">
                <AlertTriangle size={42} className="stroke-[2.3]" />
              </div>

              <div className="absolute -right-2 -top-2 rounded-xl border border-error/30 bg-base-100 px-2 py-1 font-mono text-[14px] font-black tracking-widest text-error shadow">
                {statusCode}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 text-center">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-base-content">
                {title}
              </h1>

              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-base-content/60">
                The platform encountered a failure while processing your
                request. <br />The requested operation could not be completed.
              </p>
            </div>

            {/* Error Message */}
            <div className="rounded-2xl border border-error/20 bg-error/5 p-4 text-left">
              
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-error" />
                <span className="font-mono text-[13px] font-black uppercase tracking-[0.2em] text-error">
                  Diagnostic Message
                </span>
              </div>

              <p className="break-words font-mono text-[15px] font-semibold leading-relaxed text-base-content">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center justify-center gap-3 pt-3 sm:flex-row">
              
              <button
                type="button"
                onClick={() => window.location.reload()}
                className=" btn btn-error rounded-2xl px-6 font-black uppercase tracking-wide shadow-lg">
                <RotateCw size={16} />
                Retry
              </button>

              <button
                type="button"
                onClick={() => window.history.back()}
                className=" btn btn-ghost rounded-2xl border border-base-300 px-6 font-bold uppercase tracking-wide">
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}