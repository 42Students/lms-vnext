import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveDayOverview } from "@/components/placements/placement-drive-day-overview";
import { PageHeader } from "@/components/ui/page-header";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";

export default async function AdminPlacementDrivePage({ params }: { params: Promise<{ jobId: string }> }) {
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) redirect("/admin/placements");
  const { jobId } = await params;
  const driveDay = await getPlacementDriveDay(context, jobId);
  return <div className="space-y-6">
    <PageHeader eyebrow="Super Admin" title={driveDay.job.title} description={driveDay.job.company.name + " · live drive-day operating view"} />
    <PlacementDriveDayOverview driveDay={driveDay} />
  </div>;
}
