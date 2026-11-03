
import { requireRole } from "@/core/auth/session";
import { ProjectForm } from "@/components/project-form";
import { PageHeading } from "@/components/ui/page-heading";
import { getCurrentApplicationLanguage } from "@/modules/translation/services/application-language.service";
import { t } from "@/shared/i18n/dictionary";

export default async function NewProjectPage() {
  await requireRole("SUPERVISOR");
  const locale = await getCurrentApplicationLanguage();

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow={t(locale, "newBrief")}
        title={t(locale, "createAProject")}
        description={t(locale, "createProjectDesc")}
      />
      <ProjectForm locale={locale} />
    </div>
  );
}
