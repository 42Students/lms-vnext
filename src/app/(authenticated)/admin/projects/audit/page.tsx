import { ProjectAdminAuditPage } from "@/components/projects/project-admin-audit-page";

export default async function SuperAdminProjectAuditPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
}) {
  return (
    <ProjectAdminAuditPage
      basePath="/admin/projects"
      searchParams={await searchParams}
    />
  );
}
