import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";
import { requireSuperAdminSelectedCollege } from "@/modules/admin-ui/super-admin-selected-college";

export default async function AdminNewPlacementPage() {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;
  if (!collegeId) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Placement Drives" description="Placement administration requires a college safety scope."
        actions={<PageBackLink href="/admin/placements" label="Placement overview" />} />
      <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
    </div>;
  }
  // Require the platform role and exact selected-college write permission before
  // rendering the form or loading any company, learner or season options.
  requireSuperAdminSelectedCollege(context,"placements.manage");
  return (
    <PlacementJobCreateWorkspace
      context={context}
      collegeId={collegeId}
      eyebrow="Super Admin"
      basePath="/admin/placements"
    />
  );
}
