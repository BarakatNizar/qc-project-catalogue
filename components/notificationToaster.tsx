
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertOctagon,
  Info,
  Zap,
  AlertTriangle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";

type ToastBoxProps = {
  icon: ReactNode;
  title: string;
  desc?: string;
  className: string;
  iconClassName?: string;
  link?: string | null;
};

function ToastBox({
  icon,
  title,
  desc,
  link,
  className,
  iconClassName = "",
}: ToastBoxProps) {
  return (
    <div
      role="status"
      className={[
        "flex w-[min(420px,calc(100vw-2rem))] min-w-0 max-w-full",
        "items-start gap-3 rounded-2xl border px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4",
        "bg-card text-card-foreground shadow-xl shadow-black/10",
        "backdrop-blur-xl transition-all duration-200",
        className,
      ].join(" ")}
    >
      <div className={`mt-0.5 shrink-0 ${iconClassName}`}>{icon}</div>

      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="break-words text-xs font-bold uppercase tracking-wider sm:text-sm">
            {title}
          </h3>

          {desc && (
            <p className="mt-1 break-words text-sm font-medium leading-relaxed text-current/80">
              {desc}
            </p>
          )}
        </div>

        {link && (
          <Link
            href={link}
            className="shrink-0 rounded-lg border border-current/20 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-current/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Open
          </Link>
        )}
      </div>
    </div>
  );
}

export const notify = {
  success: (title: string, desc?: string) => {
    toast.custom(
      () => (
        <ToastBox
          title={title}
          desc={desc}
          className="border-success/30 bg-success/10"
          iconClassName="text-success"
          icon={<CheckCircle2 size={21} />}
        />
      ),
      { duration: 6000 },
    );
  },

  error: (title: string, desc?: string) => {
    toast.custom(
      () => (
        <ToastBox
          title={title}
          desc={desc}
          className="border-error/30 bg-error/10"
          iconClassName="text-error"
          icon={<AlertOctagon size={21} />}
        />
      ),
      { duration: 6000 },
    );
  },

  warning: (title: string, desc?: string) => {
    toast.custom(
      () => (
        <ToastBox
          title={title}
          desc={desc}
          className="border-warning/30 bg-warning/10"
          iconClassName="text-warning"
          icon={<AlertTriangle size={21} />}
        />
      ),
      { duration: 6000 },
    );
  },

  info: (title: string, desc?: string) => {
    toast.custom(
      () => (
        <ToastBox
          title={title}
          desc={desc}
          className="border-info/30 bg-info/10"
          iconClassName="text-info"
          icon={<Info size={21} />}
        />
      ),
      { duration: 6000 },
    );
  },

  protocol: (title: string, desc?: string) => {
    toast.custom(
      () => (
        <ToastBox
          title={title}
          desc={desc}
          className="border-primary/30 bg-primary/10"
          iconClassName="text-primary"
          icon={<Zap size={21} className="animate-pulse motion-reduce:animate-none" />}
        />
      ),
      { duration: 6000 },
    );
  },

  system: (title: string, desc?: string, link?: string) => {
    toast.custom(
      () => (
        <ToastBox
          title={title}
          desc={desc}
          link={link}
          className="border-border bg-card"
          iconClassName="text-primary"
          icon={<ShieldAlert size={21} />}
        />
      ),
      { duration: 6000 },
    );
  },

  loading: (title: string, desc?: string) => {
    return toast.custom(
      () => (
        <ToastBox
          title={title}
          desc={desc}
          className="border-primary/30 bg-card"
          iconClassName="text-primary"
          icon={<Loader2 size={21} className="animate-spin motion-reduce:animate-none" />}
        />
      ),
      { duration: 2000 },
    );
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  promise: (
    promise: Promise<unknown>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    },
  ) => {
    return toast.promise(promise, {
      loading: (
        <ToastBox
          title={loading}
          className="border-primary/30 bg-card"
          iconClassName="text-primary"
          icon={<Loader2 size={21} className="animate-spin motion-reduce:animate-none" />}
        />
      ),

      success: (
        <ToastBox
          title={success}
          className="border-success/30 bg-success/10"
          iconClassName="text-success"
          icon={<CheckCircle2 size={21} />}
        />
      ),

      error: (
        <ToastBox
          title={error}
          className="border-error/30 bg-error/10"
          iconClassName="text-error"
          icon={<AlertOctagon size={21} />}
        />
      ),
    });
  },
};
