import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsOverview } from "@/components/placements/placement-operations-overview";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";

export default async function TpoPlacementsPage() {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }
  const operations =
    await getPlacementTpoOperations(
      context,
      context.membership.collegeId,
    );
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO"
        title="Placement Operations"
        description="One prioritized command center for screening, drives, results and upcoming rounds."
        actions={
          <Link
            href="/tpo/placements/new"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover"
          >
            New opportunity
          </Link>
        }
      />
      <PlacementOperationsOverview
        operations={operations}
        basePath="/tpo/placements"
      />
    </div>
  );
}
