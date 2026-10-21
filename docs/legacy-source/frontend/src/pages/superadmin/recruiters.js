import RecruiterAccounts from "./sections/RecruiterAccounts";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

// Placements > Recruiter accounts. A recruiter (industry recruiter) spans colleges; with a college selected in the superadmin
// scope, the list narrows to recruiters with access to that college.
export default function SuperAdminRecruiter() {
  const { selectedOrganizationId, selectedCollegeId } = useSuperAdminScope();
  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="placements">
        <RecruiterAccounts selectedOrganizationId={selectedOrganizationId ?? null} selectedCollegeId={selectedCollegeId ?? null} />
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminRecruiter.superAdminLayout = SuperAdminLayout;
