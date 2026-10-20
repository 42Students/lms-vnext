import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function CollegePlacementDrivePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(
      context,
      "COLLEGE_ADMIN",
    )
  ) {
    redirect("/dashboard");
  }
  const { jobId } = await params;
  return (
    <div className="min-w-0 space-y-6">
    <PlacementDriveWorkspace
      context={context}
      jobId={jobId}
    />
    </div>
  );
}
