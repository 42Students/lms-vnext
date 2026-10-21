/**
 * Superadmin Hiring Dashboard — metrics, funnel, and company-wise report, scoped to the
 * currently selected college in the header scope selector.
 */
import { Alert } from "antd";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import HiringDashboard from "@/pages/superadmin/sections/HiringDashboard";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

export default function SuperAdminHiringDashboard() {
  const { selectedCollegeId } = useSuperAdminScope();

  if (selectedCollegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Hiring metrics are college-scoped. Pick an Organization + College in the header above."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page placements-page">
      <SuperAdminGroupShell groupKey="placements">
        <HiringDashboard adminMode="lms" collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} />
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminHiringDashboard.superAdminLayout = SuperAdminLayout;
