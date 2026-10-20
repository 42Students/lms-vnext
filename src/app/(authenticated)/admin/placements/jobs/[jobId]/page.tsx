import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { PlacementDriveWorkspace } from "@/components/placements/placement-drive-workspace";
import { getSuperAdminDrivePipeline } from "@/modules/placements/super-admin-drive-pipeline-service";
import { SuperAdminDrivePipeline } from "@/components/placements/super-admin-drive-pipeline";

export default async function AdminPlacementDrivePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Placement Drives" description="Placement administration requires a college safety scope."
      actions={<PageBackLink href="/admin/placements" label="Placement overview" />} />
    <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
  </div>;
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const { jobId } = await params;
  const pipeline = await getSuperAdminDrivePipeline(context, jobId);
  return (
   <div className="min-w-0 space-y-5">
    
    <PlacementDriveWorkspace
      context={context}
      jobId={jobId}
    />
    <SuperAdminDrivePipeline rows={pipeline} />
   </div>
  );
}
