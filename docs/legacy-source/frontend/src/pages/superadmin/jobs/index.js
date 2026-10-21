import { Alert } from "antd";
import DrivesLanding from "../sections/DrivesLanding";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

export default function SuperAdminJobs() {
  const { selectedCollegeId } = useSuperAdminScope();

  if (selectedCollegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Drives is college-scoped. Pick an Organization + College in the header above."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <JobsErrorBoundary>
      <div className="ln-module admin-list-page placements-page">
        <SuperAdminGroupShell groupKey="placements">
          <DrivesLanding collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} basePath="/superadmin" />
        </SuperAdminGroupShell>
      </div>
    </JobsErrorBoundary>
  );
}

SuperAdminJobs.superAdminLayout = SuperAdminLayout;
