import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function TpoPlacementDrivePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }
  const { jobId } = await params;
  return (
    <PlacementDriveWorkspace
      context={context}
      jobId={jobId}
      eyebrow="TPO"
    />
  );
}
