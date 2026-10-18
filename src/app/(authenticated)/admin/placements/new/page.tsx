import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementJobCreateWorkspace } from "@/components/placements/placement-job-create-workspace";

export default async function AdminNewPlacementPage() {
  const context = await getCurrentRequestContext();
  const collegeId =
    context.adminScope?.collegeId ?? null;
  if (!collegeId) {
    return <div className="min-w-0 space-y-4">
      <PageHeader eyebrow="Super Admin" title="Placement Drives" description="Placement administration requires a college safety scope." />
      <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
    </div>;
  }
  return (
    <PlacementJobCreateWorkspace
      context={context}
      collegeId={collegeId}
      eyebrow="Super Admin"
      basePath="/admin/placements"
    />
  );
}
