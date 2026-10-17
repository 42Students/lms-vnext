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
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Academics"
        description="Programs, academic periods, Cohorts and period-specific Sections for your college."
      />
      <div>
        <Link
          href="/college/programs"
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
        >
          Open Programs directory
        </Link>
      </div>
      <AcademicsOverview
        collegeId={membership.collegeId}
        workspace={workspace}
        sectionBasePath="/college/academics/sections"
      />
    </div>
  );
}
