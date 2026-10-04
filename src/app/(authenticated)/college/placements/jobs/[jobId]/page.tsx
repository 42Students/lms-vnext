import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveDayOverview } from "@/components/placements/placement-drive-day-overview";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";

export default async function CollegePlacementDrivePage({ params }: { params: Promise<{ jobId: string }> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  const { jobId } = await params;
  const driveDay = await getPlacementDriveDay(context, jobId);
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin" title={driveDay.job.title} description={driveDay.job.company.name + " · live drive-day operating view"} />
    <PlacementDriveDayOverview driveDay={driveDay} />
  </div>;
}
