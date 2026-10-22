import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import {AdminPlacementCreateDialog} from "@/components/placements/admin-placement-create-dialog";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";
import { requireSuperAdminSelectedCollege } from "@/modules/admin-ui/super-admin-selected-college";
import { AuthorizationError } from "@/modules/permissions/policy";

export default async function AdminNewPlacementPage() {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;
  if (!collegeId) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Drives" description="Placement administration requires a college safety scope."
        actions={<PageBackLink href="/admin/placements" label="Placement overview"/>}/>
      <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
    </div>;
  }
  // Require the platform role and exact selected-college write permission before
  // rendering the form or loading any company, learner or season options.
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const loaded=await PlacementJobCreateWorkspace({
    context,collegeId,basePath:"/admin/placements",
  }).then(view=>({ok:true as const,view}))
    .catch(error=>{
      if (error instanceof AuthorizationError) throw error;
      return {ok:false as const};
    });
  if(!loaded.ok)return <div className="min-w-0 space-y-5">
    <PageHeader title="Create drive"
      description="Build the opportunity students will see"
      actions={<PageBackLink href="/admin/placements" label="Back to drives" />}/>
    <ErrorState title="Drive setup unavailable"
      description="Company, season, or student eligibility choices could not be loaded. No draft was created."
      retryHref="/admin/placements/new" retryLabel="Retry creating drive"/>
  </div>;
  return <AdminPlacementCreateDialog>{loaded.view}</AdminPlacementCreateDialog>;
}
