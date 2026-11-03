import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="max-w-3xl space-y-4">
        {eyebrow && (
          <p className="font-semibold text-xl font-black uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          {title}
        </h1>
        {description && (
          <p className="max-w-3xl leading-relaxed text-muted-foreground font-semibold text-lg">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}