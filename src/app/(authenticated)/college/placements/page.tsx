import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsOverview } from "@/components/placements/placement-operations-overview";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";

export default async function CollegePlacementsPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");
  const operations = await getPlacementTpoOperations(context, context.membership.collegeId);
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin" title="Placements" description="Placement operations inside your active college membership." />
    <PlacementOperationsOverview operations={operations} basePath="/college/placements" />
  </div>;
}
