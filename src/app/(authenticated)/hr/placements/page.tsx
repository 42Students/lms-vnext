import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterPlacementPortfolio } from "@/components/placements/recruiter-placement-portfolio";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";

export default async function HrPlacementsPage() {
  const context =
    await getCurrentRequestContext();
  if (!hasActiveRecruiter(context)) {
    redirect("/dashboard");
  }

  const jobs =
    await listOwnRecruiterPlacementJobs(
      context,
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer Recruiter"
        title="Hiring Workspace"
        description="Only opportunities belonging to your employer and explicitly granted colleges appear here. College-private CRM notes and placement-cell actions are not exposed."
      />
      <RecruiterPlacementPortfolio
        jobs={jobs}
      />
    </div>
  );
}
