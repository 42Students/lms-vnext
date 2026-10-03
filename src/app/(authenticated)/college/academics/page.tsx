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
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Academics"
        description="Programs, academic periods, Cohorts and period-specific Sections for your college."
      />
      <AcademicsOverview
        collegeId={membership.collegeId}
        workspace={workspace}
        sectionBasePath="/college/academics/sections"
      />
    </div>
  );
}
