// shared/ui/toast/notificationToaster.tsx
import { toast } from "sonner";
import { CheckCircle2, AlertOctagon, Info, Zap, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";

/* ============================================================
   BASE TOAST COMPONENT
============================================================ */

type ToastBoxProps = {
  icon: ReactNode;
  title: string;
  desc?: string;
  className: string;
  link?:string |null
};


function ToastBox({
  icon,
  title,
  desc,
  link,
  className,
}: ToastBoxProps) {
  return (
    <div
      className={`
        flex items-start gap-4
        min-w-[360px] max-w-[420px]
        rounded-2xl border
        px-5 py-4
        shadow-2xl backdrop-blur
        transition-all duration-300
        bg-base-100
        ${className}
      `}
    >
      <div className="mt-0.5 shrink-0">
        {icon}
      </div>

      <div className="flex-1 flex gap-0.5">
        <div className="flex-1 flex flex-col">

          <h3 className="text-sm font-black tracking-widest uppercase">
            {title}
          </h3>

          {desc && (
            <p className="mt-1 text-sm opacity-80 font-medium leading-relaxed">
              {desc}
            </p>
          )}
      </div>
        {link && (
        <Link href={link} className="btn btn-sm btn-outline mt-1 text-sm opacity-80 font-medium leading-relaxed">
          Open
        </Link>
      )}
      </div>
    </div>
  );
}

/* ============================================================
   NOTIFICATION API
============================================================ */

export const notify = {
  success: (title: string, desc?: string) => {
    toast.custom(() => (
      <ToastBox
        title={title}
        desc={desc}
        className="
          border-success/40
          bg-success
          text-success-content
        "
        icon={<CheckCircle2 size={22} />}
      />
    ), { duration: 6000 });
  },

  error: (title: string, desc?: string) => {
    toast.custom(() => (
      <ToastBox
        title={title}
        desc={desc}
        className="
          border-error/40
          bg-error
          text-error-content
        "
        icon={<AlertOctagon size={22} />}
      />
    ), { duration: 6000 });
  },

  warning: (title: string, desc?: string) => {
    toast.custom(() => (
      <ToastBox
        title={title}
        desc={desc}
        className="
          border-warning/40
          bg-warning
          text-warning-content
        "
        icon={<AlertTriangle size={22} />}
      />
    ), { duration: 6000 });
  },

  info: (title: string, desc?: string) => {
    toast.custom(() => (
      <ToastBox
        title={title}
        desc={desc}
        className="
          border-info/40
          bg-info
          text-info-content
        "
        icon={<Info size={22} />}
      />
    ), { duration: 6000 });
  },

  protocol: (title: string, desc?: string) => {
    toast.custom(() => (
      <ToastBox
        title={title}
        desc={desc}
        className="
          border-primary/40
          bg-primary
          text-primary-content
        "
        icon={<Zap size={22} className="animate-pulse" />}
      />
    ), { duration: 6000 });
  },

  system: (title: string, desc?: string, link?:string) => {
    toast.custom(() => (
      <ToastBox
        title={title}
        desc={desc}
        link={link}
        className="
          border-base-300
          bg-base-200
          text-base-content
        "
        icon={<ShieldAlert size={22} />}
      />
    ), { duration: 6000 });
  },

  loading: (title: string, desc?: string) => {
    return toast.custom(() => (
      <ToastBox
        title={title}
        desc={desc}
        className="
          border-accent/40
          bg-neutral
          text-neutral-content
        "
        icon={<Loader2 size={22} className="animate-spin" />}
      />
    ), { duration: 2000 });
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  promise: async (
    promise: Promise<any>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: (
        <ToastBox
          title={loading}
          className="
            border-warning/40
            bg-warning
            text-warning-content
          "
          icon={<Loader2 size={22} className="animate-spin" />}
        />
      ),

      success: (
        <ToastBox
          title={success}
          className="
            border-success/40
            bg-success
            text-success-content
          "
          icon={<CheckCircle2 size={22} />}
        />
      ),

      error: (
        <ToastBox
          title={error}
          className="
            border-error/40
            bg-error
            text-error-content
          "
          icon={<AlertOctagon size={22} />}
        />
      ),
    });
  },
};
