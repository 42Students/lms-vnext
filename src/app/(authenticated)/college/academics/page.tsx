import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AcademicsOverview } from "@/components/academics/academics-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getAcademicsWorkspace } from "@/modules/academics/workspace";

export default async function CollegeAcademicsPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  if (!membership) {
    redirect("/dashboard");
  }

  const workspace = await getAcademicsWorkspace(
    context,
    membership.collegeId,
  );

  return (
    <div className="min-w-0 overflow-x-clip space-y-4 md:space-y-6">
      <PageHeader
        title="Academics"
        description="Programs, academic periods, Cohorts and period-specific Sections for your college."
        actions={<Link href="/college/programs"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Open Programs directory
        </Link>}
      />
      <section aria-label="College academic structure" className="min-w-0">
      <AcademicsOverview
        collegeId={membership.collegeId}
        workspace={workspace}
        sectionBasePath="/college/academics/sections"
      />
      </section>
    </div>
  );
}
