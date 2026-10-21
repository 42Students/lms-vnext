import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import {AdminPlacementCreateDialog} from "@/components/placements/admin-placement-create-dialog";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";
import { requireSuperAdminSelectedCollege } from "@/modules/admin-ui/super-admin-selected-college";

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
    .catch(()=>({ok:false as const}));
  if(!loaded.ok)return <div className="min-w-0 space-y-5">
    <PageHeader title="Create drive"
      description="Build the opportunity students will see"
      actions={<PageBackLink href="/admin/placements" label="Back to drives" />}/>
    <ErrorState title="Drive setup unavailable"
      description="Company, season, or student eligibility choices could not be loaded. No draft was created."
      action={<Link href="/admin/placements/new" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 w-full md:w-auto">Retry creating drive</Link>}/>
  </div>;
  return <AdminPlacementCreateDialog>{loaded.view}</AdminPlacementCreateDialog>;
}
