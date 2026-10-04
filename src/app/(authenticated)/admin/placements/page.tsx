import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsOverview } from "@/components/placements/placement-operations-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";

export default async function AdminPlacementsPage() {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;
  if (!collegeId) return <div className="space-y-6">
    <PageHeader eyebrow="Super Admin" title="Placements" description="Placement administration requires a college safety scope." />
    <EmptyState title="Select a college scope" description="Choose a college in the Super Admin scope selector before opening Placement operations." />
  </div>;
  const operations = await getPlacementTpoOperations(context, collegeId);
  return <div className="space-y-6">
    <PageHeader eyebrow="Super Admin" title="Placements" description="Placement operations inside the selected college safety scope." />
    <PlacementOperationsOverview operations={operations} basePath="/admin/placements" />
  </div>;
}
