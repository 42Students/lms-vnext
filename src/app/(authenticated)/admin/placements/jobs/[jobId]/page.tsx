import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import {SuperAdminDriveTabs} from "@/components/placements/super-admin-drive-tabs";

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
   <div className="space-y-5">
    <SuperAdminDriveTabs jobId={jobId} active="Overview"/>
    <PlacementDriveWorkspace
      context={context}
      jobId={jobId}
      eyebrow="Super Admin"
    />
   </div>
  );
}
