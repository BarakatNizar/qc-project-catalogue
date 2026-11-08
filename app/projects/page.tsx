import ProjectCatalogPage from '@/components/pages/ProjectCatalogPage';
import { requireUser } from '@/core/auth'
import { getCurrentApplicationLanguage } from '@/modules/translation/services/application-language.service';


const ProjectsPage =async () => {
  await requireUser();
  const locale  = await getCurrentApplicationLanguage();
  return <ProjectCatalogPage locale={locale} />
}

export default ProjectsPage