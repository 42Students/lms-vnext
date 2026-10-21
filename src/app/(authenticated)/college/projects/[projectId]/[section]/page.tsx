import {CollegeProjectDeliveryOverview} from "@/components/projects/college-project-delivery-overview";
import { AdminProjectSectionPage } from "@/components/projects/admin-project-section-page";

export default async function CollegeProjectSectionRoute({
  params,
}: {
  params: Promise<{
    projectId: string;
    section: string;
  }>;
}) {
  const { projectId, section } = await params;
  if(section==="delivery")return <CollegeProjectDeliveryOverview projectId={projectId}/>;
  return (
    <AdminProjectSectionPage
      projectId={projectId}
      section={section}
      basePath="/college/projects"
    />
  );
}
