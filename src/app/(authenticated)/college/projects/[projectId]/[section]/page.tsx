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
  return (
    <AdminProjectSectionPage
      projectId={projectId}
      section={section}
      basePath="/college/projects"
      eyebrow="College Admin Project"
    />
  );
}
