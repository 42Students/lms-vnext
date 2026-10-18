import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminAuditPage } from "@/components/projects/project-admin-audit-page";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";

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
  const context = await getCurrentRequestContext();
  const collegeId =
    getProjectAdminCollegeId(context);

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-6">
        <ProjectAdminNav
          basePath="/admin/projects"
          active="audit"
        />
        <PageHeader
          eyebrow="Super Admin Projects"
          title="Project audit"
          description="Project audit requires an exact college safety scope."
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before reviewing project activity."
        />
      </div>
    );
  }

  return (
    <ProjectAdminAuditPage
      basePath="/admin/projects"
      searchParams={await searchParams}
    />
  );
}
