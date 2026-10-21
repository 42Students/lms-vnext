import { useRouter } from "next/router";
import { Alert } from "antd";
import JobApplications from "../../sections/JobApplications";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

/**
 * Superadmin view for job applications. collegeId always comes from the header scope
 * selector (SuperAdminScopeContext) — a URL/query collegeId is never trusted, since that
 * would let a page reload with a stale collegeId view/mutate a different college's
 * application data just by editing the URL.
 */
export default function SuperAdminJobApplicationsPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId } = useSuperAdminScope();

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert
          type="warning"
          message="Select a college to continue"
          description="Applications is college-scoped. Pick an Organization + College in the header above."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <JobsErrorBoundary onBack={() => router.push("/superadmin/jobs")}>
      <div className="ln-module admin-list-page placements-page">
        <DriveSubNav jobId={router.query.jobId} active="applications" basePath="/superadmin" />
        <JobApplications
          jobType="lms"
          fortyTwoLearnId={null}
          collegeId={collegeId}
          basePath="/superadmin"
        />
      </div>
    </JobsErrorBoundary>
  );
}

SuperAdminJobApplicationsPage.superAdminLayout = SuperAdminLayout;
