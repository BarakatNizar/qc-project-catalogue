import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserForService } from "@/core/auth/session";
import { aiProviderConfigService } from "@/modules/ai/services/ai-provider-config-service";
import { AdminAiProviderManager } from "@/components/admin-ai-provider-manager";

export default async function AdminAiProvidersPage() {
  const actor = await requireUserForService();
  if ("redirect" in actor) redirect(actor.redirect);
  if ("error" in actor) {
    return <main className="mx-auto max-w-5xl p-8"><div className="alert alert-error">{actor.error}</div></main>;
  }
  if (actor.user.role !== "ADMIN") {
    return <main className="mx-auto max-w-5xl p-8"><div className="alert alert-error">Only administrators can manage AI providers.</div></main>;
  }

  const config = await aiProviderConfigService.getAdminConfiguration(actor.user);

  return (
    <main className="mx-auto max-w-screen-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 border-b border-base-300 pb-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Administration / AI</p>
          <h1 className="text-3xl font-semibold tracking-tight">AI provider configuration</h1>
          <p className="max-w-3xl text-sm text-base-content/70">
            Configure up to four providers and arrange their execution order. If an enabled provider fails, QC tries the next enabled provider.
            API keys are encrypted before storage and are never displayed after saving.
          </p>
        </div>
        <Link className="btn btn-ghost btn-sm self-start md:self-auto" href="/admin/ai/logs">AI logs</Link>
      </header>

      <AdminAiProviderManager initialProviders={config.providers} initialAiEnabled={config.aiEnabled} />
    </main>
  );
}
