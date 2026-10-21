import { Alert } from "antd";
import Jobs from "../sections/Jobs";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

/**
 * The full flat drive table (every drive, active or not) — kept as a secondary, quieter view
 * behind a link from the Drives landing page, rather than deleting it. The landing page's card
 * grid is the primary experience now; this is the escape hatch for "show me everything."
 */
export default function SuperAdminAllJobs() {
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
          <Jobs collegeId={selectedCollegeId} key={selectedCollegeId ?? "none"} basePath="/superadmin" />
        </SuperAdminGroupShell>
      </div>
    </JobsErrorBoundary>
  );
}

SuperAdminAllJobs.superAdminLayout = SuperAdminLayout;
