import ProjectCatalogPage from '@/components/pages/ProjectCatalogPage';
import { requireUser } from '@/core/auth'
import { getCurrentApplicationLanguage } from '@/modules/translation/services/application-language.service';


const ManagerProjectsPage =async () => {
  await requireUser();
  const locale  = await getCurrentApplicationLanguage();
  return <ProjectCatalogPage locale={locale} isSupervisor={true} />
}

export default ManagerProjectsPage