import { useRouter } from "next/router";
import { Alert } from "antd";
import JobApplications from "../../sections/JobApplications";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

/**
 * Superadmin view for shortlisted pipeline: Assessment, Interviews, Offers.
 * collegeId always comes from the header scope selector (SuperAdminScopeContext) — never
 * from the URL, which would let a stale/mismatched scope reach another college's pipeline
 * just by editing the query string.
 */
export default function SuperAdminJobShortlistedPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId } = useSuperAdminScope();

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Shortlisted is college-scoped. Pick an Organization + College in the header above."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <JobsErrorBoundary onBack={() => router.push("/superadmin/jobs")}>
      <div className="ln-module admin-list-page placements-page">
        {/* active="applications" is intentional, not a missing "shortlisted" tab: DriveSubNav's
            SECTIONS has no shortlisted entry because Shortlisted is reached as a sub-view *from*
            Applications (via the "Manage Shortlisted" button in JobApplications.js), not as its
            own peer top-level tab — so highlighting "Applications" here is correct. */}
        <DriveSubNav jobId={router.query.jobId} active="applications" basePath="/superadmin" />
        <JobApplications
          jobType="lms"
          fortyTwoLearnId={null}
          collegeId={collegeId}
          basePath="/superadmin"
          shortlistedMode
        />
      </div>
    </JobsErrorBoundary>
  );
}

SuperAdminJobShortlistedPage.superAdminLayout = SuperAdminLayout;
