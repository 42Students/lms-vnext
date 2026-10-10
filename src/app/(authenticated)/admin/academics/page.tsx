import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AcademicsOverview } from "@/components/academics/academics-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getAcademicsWorkspace } from "@/modules/academics/workspace";

export default async function SuperAdminAcademicsPage() {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Academics"
          description="Academic administration requires a college safety scope."
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before managing Programs, Periods, Cohorts or Sections."
        />
      </div>
    );
  }

  const workspace = await getAcademicsWorkspace(
    context,
    collegeId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Academics"
        description="Academic structure inside the selected college safety scope."
      />
      <div>
        <Link
          href="/admin/programs"
          className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
        >
          Open Programs directory
        </Link>
      </div>
      <AcademicsOverview
        collegeId={collegeId}
        workspace={workspace}
        sectionBasePath="/admin/academics/sections"
      />
    </div>
  );
}
