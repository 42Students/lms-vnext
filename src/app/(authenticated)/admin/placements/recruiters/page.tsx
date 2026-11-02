import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function SuperAdminPlacementRecruitersPage() {
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) {
    return (
      <div className="min-w-0 space-y-4">
        <PageHeader title="Recruiters" description="Choose a college scope before viewing placement recruiters." />
        <EmptyState title="Choose a college" description="Use the Super Admin college switcher to select an organization you are permitted to access." />
      </div>
    );
  }
  return (
    <div className="min-w-0 space-y-4">
      <PageHeader title="Recruiters" description="Placement recruiters for the selected college." />
      <EmptyState title="No recruiters to show yet" description="Recruiter listings for this college will appear here." />
    </div>
  );
}
