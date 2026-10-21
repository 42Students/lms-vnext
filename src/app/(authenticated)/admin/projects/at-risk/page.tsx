import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { isSuperAdmin } from "@/modules/identity/context";
import { ErrorState } from "@/components/ui/error-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { ProjectAdminAtRiskPage } from "@/components/projects/project-admin-at-risk-page";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
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
  if (!isSuperAdmin(context)) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="At Risk" actions={<PageBackLink href="/admin/projects" label="Project workspaces" />} />
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
          title="At Risk"
          description="A selected college scope is required."
          actions={<PageBackLink href="/admin/projects" label="Project workspaces" />}
        />
        <ProjectAdminNav basePath="/admin/projects" active="at-risk" />
        <Alert tone="warning" role="status">
          Select a college to continue. Choose a college in the header before viewing at-risk projects.
        </Alert>
        <div aria-hidden="true" className="pointer-events-none opacity-60">
          <Skeleton variant="row" count={4} label="Awaiting college scope"/>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<section className="min-w-0 space-y-[var(--lms-space-4)]" aria-busy="true">
      <PageHeader title="At-risk projects" description="Workspaces with no recent activity, an active blocker, or a pending review."
        actions={<PageBackLink href="/admin/projects" label="Project workspaces" />}/>
      <ProjectAdminNav basePath="/admin/projects" active="at-risk" />
      <p role="status" className="text-sm text-[var(--lms-body-text)]">Loading at-risk projects for the selected college…</p>
      <Skeleton variant="row" count={8} label="Loading at-risk projects" />
    </section>}>
      <ProjectAdminAtRiskPage
        collegeId={collegeId}
        basePath="/admin/projects"
        searchParams={await searchParams}
      />
    </Suspense>
  );
}
