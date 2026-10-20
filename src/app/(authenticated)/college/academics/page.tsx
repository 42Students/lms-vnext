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
    <div className="min-w-0 overflow-x-clip space-y-6">
      <PageHeader
        title="Academics"
        description="Programs, academic periods, Cohorts and period-specific Sections for your college."
      />
      <div className="border-b border-border pb-4">
        <Link
          href="/college/programs"
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9"
        >
          Open Programs directory
        </Link>
      </div>
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
