import { isSuperAdmin } from "@/modules/identity/context";
import { ErrorState } from "@/components/ui/error-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ProjectAdminAuditPage } from "@/components/projects/project-admin-audit-page";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
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
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Audit" actions={<PageBackLink href="/admin/projects" label="Project workspaces" />} />
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
      <div className="min-w-0 space-y-4">
        <PageHeader
          title="Audit"
          description="Project audit requires an exact college safety scope."
          actions={<PageBackLink href="/admin/projects" label="Project workspaces" />}
        />
        <ProjectAdminNav basePath="/admin/projects" active="audit" />
        <Banner tone="warning" role="status">
          Select a college in the header to restore its project audit scope. The roster is not loading until a college is selected.
        </Banner>
        <EmptyState
          title="Select a college to continue"
          description="Choose a college in the Super Admin scope selector before reviewing project activity. Global project audit is available only with explicit platform-wide audit permission."
        />
      </div>
    );
  }

  return <div className="min-w-0 space-y-4">
    {!collegeId ? <Banner tone="warning" role="status">
      Platform-wide project audit. Results may include multiple colleges under
      your explicitly authorized global audit scope. Select one college in the
      scope switcher to narrow the audit before reviewing or exporting events.
    </Banner> : <Banner tone="info" role="status">
      Selected-college project audit. Results are restricted to the current college.
    </Banner>}
    <ProjectAdminAuditPage
      basePath="/admin/projects"
      searchParams={await searchParams}
    />
  </div>;
}
