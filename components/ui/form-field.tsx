import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function FormField({ label, name, hint, children }: { label: string; name: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-[14px] font-bold uppercase tracking-wider text-muted-foreground" htmlFor={name}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[14px] leading-relaxed text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      id={props.id ?? props.name}
      className={`w-full rounded-xl border border-border/70 bg-background/50 px-4 py-2.5 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      id={props.id ?? props.name}
      className={`w-full rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-[15px] font-medium text-foreground outline-none backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-28 resize-y placeholder:text-muted-foreground/50 ${props.className ?? ""}`}
    />
  );
}