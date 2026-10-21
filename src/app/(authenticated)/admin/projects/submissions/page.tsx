import { isSuperAdmin } from "@/modules/identity/context";
import { ErrorState } from "@/components/ui/error-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { ProjectAdminSubmissionsPage } from "@/components/projects/project-admin-submissions-page";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
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
  if (!isSuperAdmin(context)) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Submissions" actions={<PageBackLink href="/admin/projects" label="Back to workspaces" />} />
      <ErrorState title="Project access denied"
        description="Your account cannot access Super Admin project workspaces."
        action={<PageBackLink href="/dashboard" label="Back to dashboard" />}
      />
    </div>;
  }
  const collegeId =
    getProjectAdminCollegeId(context);

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader
          title="Submissions"
          description="A selected college scope is required."
          actions={<PageBackLink href="/admin/projects" label="Back to workspaces" />}
        />
        <ProjectAdminNav basePath="/admin/projects" active="submissions" />
        <EmptyState
          title="No college selected"
          description="Pick a college in the header to view its submissions."
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
