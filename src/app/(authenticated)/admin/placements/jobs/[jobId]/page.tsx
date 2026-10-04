import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";

export default async function AdminPlacementDrivePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) {
    redirect("/admin/placements");
  }
  const { jobId } = await params;
  return (
    <PlacementDriveWorkspace
      context={context}
      jobId={jobId}
      eyebrow="Super Admin"
    />
  );
}
