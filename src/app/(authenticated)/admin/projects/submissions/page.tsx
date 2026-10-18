import { getCurrentRequestContext } from "@/auth/request-context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { ProjectAdminSubmissionsPage } from "@/components/projects/project-admin-submissions-page";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";

export default async function SuperAdminProjectSubmissionsRoute({
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
          active="submissions"
        />
        <PageHeader
          eyebrow="Super Admin Projects"
          title="Project submissions"
          description="A selected college scope is required."
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college before reviewing project submissions."
        />
      </div>
    );
  }

  return (
    <ProjectAdminSubmissionsPage
      collegeId={collegeId}
      basePath="/admin/projects"
      eyebrow="Super Admin Projects"
      searchParams={await searchParams}
    />
  );
}
