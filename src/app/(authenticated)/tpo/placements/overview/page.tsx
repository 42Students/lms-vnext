import { TPO_OWNER_PAGE_COPY } from "@/modules/placements/tpo-page-copy";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { Dropdown } from "@/components/ui/dropdown";
import { hasMembershipRole } from "@/modules/identity/context";
import { ButtonLink } from "@/components/ui/button-link";

import { ROLE } from "@/modules/identity/roles";
export default async function TpoPlacementsOverviewPage() {
  const context = await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, ROLE.TPO)
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
            <ButtonLink variant="primary"
              href="/tpo/placements/new"
              className="w-full sm:w-auto"
            >
              + Create drive
            </ButtonLink>
            <Dropdown mobileSheet align="end" label="Other placement operations" trigger="More ···">
              <nav aria-label="Placement operation links" className="min-w-48 space-y-1">
                <ButtonLink variant="secondary" href="/tpo/placements/lifecycle" className="block">Drive lifecycle</ButtonLink>
                <ButtonLink variant="secondary" href="/tpo/placements/schedule-conflicts" className="block">Review schedule conflicts</ButtonLink>
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
