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
  // Preserve only validated old workspace navigation context. The selected
  // college derives from authorized admin scope, never from a query override.
  const one = (value: string | string[] | undefined) =>
    typeof value==="string" && value.length<=120 && /^[a-zA-Z0-9 _-]*$/.test(value)
      ? value : undefined;
  return (
    <div className="min-w-0 max-w-full">
    <AdminProjectSectionPage
      projectId={projectId}
      section={section}
      basePath="/admin/projects"
      from={one(query.from)}
      reason={one(query.reason)}
      polishAdminSection
    />
    </div>
  );
}
