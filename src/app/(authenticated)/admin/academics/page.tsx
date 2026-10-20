import Link from "next/link";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/modules/identity/context";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AcademicsOverview } from "@/components/academics/academics-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getAcademicsWorkspace } from "@/modules/academics/workspace";

export default async function SuperAdminAcademicsPage() {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");
  const collegeId =
    context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Academics"
          description="Academic administration requires a college safety scope."
          actions={<div className="flex flex-wrap items-center gap-[var(--lms-space-2)]">
            <Link href="/admin/electives" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-4)] text-[14px] font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-[var(--lms-control-height)]">Elective slots →</Link>
                    <Link href="/admin/batch-promotion" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-4)] text-[14px] font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-[var(--lms-control-height)]">Batch Promotion Preview →</Link>
          </div>}
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
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Academics"
        description="Academic structure inside the selected college safety scope."
        actions={<div className="flex flex-wrap items-center gap-[var(--lms-space-2)]">
          <Link href="/admin/electives"
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-4)] text-[14px] font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-[var(--lms-control-height)]">
                    Elective slots
                  </Link>
                  <Link
                    href="/admin/programs"
                    className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-4)] text-[14px] font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-[var(--lms-control-height)]"
                  >
                    Open Programs directory
                  </Link><Link href="/admin/batch-promotion" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-4)] text-[14px] font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-[var(--lms-control-height)]">Batch Promotion Preview →</Link>
        </div>}
      />
      <AcademicsOverview
        collegeId={collegeId}
        workspace={workspace}
        sectionBasePath="/admin/academics/sections"
      />
    </div>
  );
}
