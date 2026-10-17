import { AdminProjectSectionPage } from "@/components/projects/admin-project-section-page";

export default async function SuperAdminProjectSectionRoute({
  params,
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{
    projectId: string;
    section: string;
  }>;
}) {
  const { projectId, section } = await params;
  const query = await searchParams;
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  return (
    <AdminProjectSectionPage
      projectId={projectId}
      section={section}
      basePath="/admin/projects"
      from={one(query.from)}
      reason={one(query.reason)}


    />
  );
}
