import { isSuperAdmin } from "@/modules/identity/context";
import { ErrorState } from "@/components/ui/error-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminAuditPage } from "@/components/projects/project-admin-audit-page";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { mayReadGlobalProjectAudit } from "@/modules/projects/admin-audit-access-model";

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
  if (!isSuperAdmin(context)) {
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Project audit" actions={<PageBackLink href="/admin/projects" label="Project workspaces" />} />
      <ErrorState title="Project access denied"
        description="Your account cannot access Super Admin project workspaces."
        action={<PageBackLink href="/dashboard" label="Back to dashboard" />}
      />
    </div>;
  }
  const collegeId =
    getProjectAdminCollegeId(context);

  if (!collegeId && !mayReadGlobalProjectAudit(context)) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          title="Project audit"
          description="Project audit requires an exact college safety scope."
          actions={<PageBackLink href="/admin/projects" label="Project workspaces" />}
        />
        <ProjectAdminNav basePath="/admin/projects" active="audit" />
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
