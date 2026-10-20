import Link from "next/link";
import { TPO_OWNER_PAGE_COPY } from "@/modules/placements/tpo-page-copy";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";

export default async function TpoPlacementsOverviewPage() {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        
        title={TPO_OWNER_PAGE_COPY.placementOperations}
        description="One prioritized command center for screening, drives, results and upcoming rounds."
        actions={
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Link href="/tpo/placements/lifecycle"
              className="inline-flex min-h-11 min-[768px]:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground">
              Drive lifecycle
            </Link>
            <Link
              href="/tpo/placements/schedule-conflicts"
              className="inline-flex min-h-11 min-[768px]:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground"
            >
              Review schedule conflicts
            </Link>
            <Link
              href="/tpo/placements/new"
              className="inline-flex min-h-11 min-[768px]:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3 text-sm font-[650] text-on-primary transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
