import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterPlacementPortfolio } from "@/components/placements/recruiter-placement-portfolio";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";

export default async function HrPlacementsPage() {
  const context =
    await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id) {
    redirect("/dashboard");
  }

  const jobs =
    await listOwnRecruiterPlacementJobs(
      context,
    );

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title="Drives"
        description="Only opportunities belonging to your employer and explicitly granted colleges appear here. College-private CRM notes and placement-cell actions are not exposed."
      />
      <RecruiterPlacementPortfolio
        jobs={jobs}
        now={new Date()}
      />
    </div>
  );
}
