import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { PlacementCalendarWorkspace } from "@/components/placements/placement-calendar-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";

type SearchParams = {
  date?: string | string[];
  view?: string | string[];
  company?: string | string[];
  roundKind?: string | string[];
  job?: string | string[];
};

export default async function SuperAdminPlacementInterviewCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-4 md:space-y-6">
        <PageHeader
          title="Interviews"
          description="Interview-calendar oversight requires an exact college safety scope."
          actions={<PageBackLink href="/admin/placements" label="Placement overview"/>}
        />
        <div className="border-l-2 border-warning bg-warning-subtle px-4 py-3">
         <EmptyState title="Select an Organization + College in the header above to view interviews."
          description="Interview appointments are visible only for one explicitly selected college. The organization or platform-wide view cannot display learner bookings."/>
        </div>
      </div>
    );
  }

  // Validate the platform actor and selected tenant before reading private rounds.
  requireSuperAdminSelectedCollege(context,"placements.read");
  return (
    <PlacementCalendarWorkspace
      context={context}
      collegeId={collegeId}
      audience="SUPER_ADMIN"
      searchParams={await searchParams}
    />
  );
}
