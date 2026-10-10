import { ProjectAdminAuditPage } from "@/components/projects/project-admin-audit-page";

export default async function CollegeProjectAuditPage({
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
      basePath="/college/projects"
      searchParams={await searchParams}
    />
  );
}
