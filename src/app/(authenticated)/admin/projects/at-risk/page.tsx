import { getCurrentRequestContext } from "@/auth/request-context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { ProjectAdminAtRiskPage } from "@/components/projects/project-admin-at-risk-page";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";

export default async function SuperAdminProjectAtRiskRoute({
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
      <div className="space-y-6">
        <ProjectAdminNav
          basePath="/admin/projects"
          active="at-risk"
        />
        <PageHeader
          eyebrow="Super Admin Projects"
          title="At-risk projects"
          description="A selected college scope is required."
        />
        <EmptyState
          title="Select a college to continue"
          description="Choose a college in the header above to see its at-risk projects."
        />
      </div>
    );
  }

  return (
    <ProjectAdminAtRiskPage
      collegeId={collegeId}
      basePath="/admin/projects"
      eyebrow="Super Admin Projects"
      searchParams={await searchParams}
    />
  );
}
