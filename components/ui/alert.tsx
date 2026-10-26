import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export function Alert({ type = "info", children }: { type?: "success" | "error" | "info"; children: React.ReactNode }) {
  const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Info;
  const styles =
    type === "success"
      ? "border-success/30 bg-success/10 text-success"
      : type === "error"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-info/30 bg-info/10 text-info";

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-xs font-semibold backdrop-blur-md ${styles}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}