import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { RecruiterPlacementPortfolio } from "@/components/placements/recruiter-placement-portfolio";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
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
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Drives"
        description="Only opportunities belonging to your employer and explicitly granted colleges appear here. College-private CRM notes and placement-cell actions are not exposed."
        actions={<Link href="/hr/drives/new" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 md:w-auto">Request a drive</Link>}
      />
      <RecruiterPlacementPortfolio
        jobs={jobs}
        now={new Date()}
      />
    </div>
  );
}
