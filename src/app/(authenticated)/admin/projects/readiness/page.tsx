import { isSuperAdmin } from "@/modules/identity/context";
import { ErrorState } from "@/components/ui/error-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { ProjectAdminReadinessPage } from "@/components/projects/project-admin-readiness-page";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { PageBackLink } from "@/components/ui/page-back-link";
import { ProjectAdminNav } from "@/components/projects/project-admin-nav";

export default async function SuperAdminProjectReadinessRoute({
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
      <PageHeader title="Readiness" actions={<PageBackLink href="/admin/projects" label="Back to workspaces" />} />
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
          title="Readiness"
          description="A selected college scope is required."
          actions={<PageBackLink href="/admin/projects" label="Back to workspaces" />}
        />
        <ProjectAdminNav basePath="/admin/projects" active="readiness" />
        <Banner tone="warning" role="status">
          Select a college in the header to load its project readiness checks. No global readiness score is inferred.
        </Banner>
        <EmptyState
          title="Select a college scope"
          description="Choose a college before reviewing project readiness."
        />
      </div>
    );
  }

  return (
    <ProjectAdminReadinessPage
      collegeId={collegeId}
      basePath="/admin/projects"
      eyebrow="Super Admin Projects"
      searchParams={await searchParams}
    />
  );
}
