import Link from "next/link";
import { TPO_OWNER_PAGE_COPY } from "@/modules/placements/tpo-page-copy";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { Dropdown } from "@/components/ui/dropdown";
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
    <div className="min-w-0 space-y-6">
      <PageHeader
        
        title={TPO_OWNER_PAGE_COPY.placementOperations}
        description="One prioritized command center for screening, drives, results and upcoming rounds."
        actions={
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
            <Link
              href="/tpo/placements/new"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3 text-sm font-[650] text-on-primary transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9"
            >
              + Create drive
            </Link>
            <Dropdown mobileSheet align="end" label="Other placement operations" trigger="More ···">
              <nav aria-label="Placement operation links" className="min-w-48 space-y-1">
                <Link href="/tpo/placements/lifecycle" className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary-subtle">Drive lifecycle</Link>
                <Link href="/tpo/placements/schedule-conflicts" className="block rounded-[var(--lms-control-radius)] px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary-subtle">Review schedule conflicts</Link>
              </nav>
            </Dropdown>
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
