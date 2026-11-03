import ProjectCatalogPage from '@/components/pages/ProjectCatalogPage';
import { requireUser } from '@/core/auth'


const ProjectsPage =async () => {
  await requireUser();
  return <ProjectCatalogPage/>
}

export default ProjectsPage