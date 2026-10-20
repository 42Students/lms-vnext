import Link from "next/link";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/modules/identity/context";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AcademicsOverview } from "@/components/academics/academics-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Dropdown } from "@/components/ui/dropdown";
import { getAcademicsWorkspace } from "@/modules/academics/workspace";

/** Keep the directory as the single headline action; related destinations remain one tap away. */
function AcademicPageActions({ scoped }: { scoped: boolean }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:items-center md:w-auto">
      {scoped ? (
        <Link href="/admin/programs" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text transition-[background-color,border-color] duration-[150ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 md:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">
          Open Programs directory
        </Link>
      ) : null}
      <Dropdown trigger="More" label="More academic actions" align="end" mobileSheet
        className="w-full sm:w-auto" triggerClassName="w-full justify-center sm:w-auto md:!min-h-9">
        <nav aria-label="Related academic pages" className="grid min-w-0 gap-[var(--lms-space-1)]">
          <Link href="/admin/electives" className="inline-flex min-h-11 w-full items-center rounded-[var(--lms-control-radius)] px-[var(--lms-space-3)] py-[var(--lms-space-2)] text-sm font-semibold text-primary-text hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {scoped ? "Elective slots" : "Elective slots →"}
          </Link>
          <Link href="/admin/batch-promotion" className="inline-flex min-h-11 w-full items-center rounded-[var(--lms-control-radius)] px-[var(--lms-space-3)] py-[var(--lms-space-2)] text-sm font-semibold text-primary-text hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Batch Promotion Preview →
          </Link>
        </nav>
      </Dropdown>
    </div>
  );
}

export default async function SuperAdminAcademicsPage() {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-[var(--lms-space-6)]">
        <PageHeader title="Academic Setup"
          description="Academic administration requires a college safety scope."
          actions={<AcademicPageActions scoped={false} />}
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before managing Programs, Periods, Cohorts or Sections."
        />
      </div>
    );
  }

  const workspace = await getAcademicsWorkspace(context, collegeId);

  return (
    <div className="min-w-0 space-y-[var(--lms-space-6)]">
      <PageHeader title="Academic Setup"
        description="Academic structure inside the selected college safety scope."
        actions={<AcademicPageActions scoped />}
      />
      <AcademicsOverview
        collegeId={collegeId}
        workspace={workspace}
        sectionBasePath="/admin/academics/sections"
      />
    </div>
  );
}
