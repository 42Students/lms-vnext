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
      <div className="min-w-0 space-y-6">
        <PageHeader
          title="Interviews"
          description="Interview-calendar oversight requires an exact college safety scope."
          actions={<PageBackLink href="/admin/placements" label="Placement overview"/>}
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before reviewing its placement interviews. An organization-level or all-platform scope is not sufficient."
        />
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
