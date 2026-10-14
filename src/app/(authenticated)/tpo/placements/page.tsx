import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function TpoPlacementsPage() {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO"
        title="Placement Operations"
        description="One prioritized command center for screening, drives, results and upcoming rounds."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tpo/placements/schedule-conflicts"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground"
            >
              Review schedule conflicts
            </Link>
            <Link
              href="/tpo/placements/new"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover"
            >
              New opportunity
            </Link>
          </div>
        }
      />
      <PlacementOperationsWorkspace
        context={context}
        collegeId={context.membership.collegeId}
        basePath="/tpo/placements"
      />
    </div>
  );
}
