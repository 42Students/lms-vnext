import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import { PlacementDriveDayOverview } from "@/components/placements/placement-drive-day-overview";
import { PageHeader } from "@/components/ui/page-header";

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
      actions={<Link href="/tpo/drive-day"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
        Open drive day / attendance
      </Link>} />
    <PlacementDriveDayOverview driveDay={drive} embedded />
  </div>;
}
