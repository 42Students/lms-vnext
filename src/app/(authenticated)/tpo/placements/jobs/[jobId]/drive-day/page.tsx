import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import { PlacementDriveDayOverview } from "@/components/placements/placement-drive-day-overview";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export default async function DriveDayForOneDrive({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const { jobId } = await params;
  const drive = await getPlacementDriveDay(context, jobId);
  return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="TPO · Drive day" title={drive.job.title + " · Drive day"}
      description="The campus-day rounds, attendance and result readiness for this drive."
      actions={<ButtonLink variant="secondary" href="/tpo/drive-day">
        Open drive day / attendance
      </ButtonLink>} />
    <PlacementDriveDayOverview driveDay={drive} embedded />
  </div>;
}
