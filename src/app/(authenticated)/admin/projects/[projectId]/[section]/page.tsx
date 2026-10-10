import { AdminProjectSectionPage } from "@/components/projects/admin-project-section-page";

export default async function SuperAdminProjectSectionRoute({
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
      basePath="/admin/projects"
      eyebrow="Super Admin Project"
    />
  );
}
