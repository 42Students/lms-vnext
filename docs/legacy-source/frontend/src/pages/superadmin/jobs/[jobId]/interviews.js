import { useRouter } from "next/router";
import { Alert } from "antd";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";
import InterviewCalendarContent from "@/components/InterviewCalendar/InterviewCalendarContent";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

/**
 * A drive's own schedule — InterviewCalendarContent already deep-links off a `jobId` query
 * param, and the dynamic route segment fills that in automatically, so no extra filtering wiring
 * is needed here.
 */
export default function SuperAdminDriveInterviewsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const { selectedCollegeId: collegeId } = useSuperAdminScope();

  const handleViewApplications = (jid) => {
    if (!jid) return;
    router.push(`/superadmin/jobs/${jid}/applications`);
  };

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert type="warning" message="Select a college to continue" showIcon />
      </div>
    );
  }

  return (
    <JobsErrorBoundary onBack={() => router.push("/superadmin/jobs")}>
      <div className="ln-module admin-list-page placements-page">
        <DriveSubNav jobId={jobId} active="interviews" basePath="/superadmin" />
        <InterviewCalendarContent
          organizationId={collegeId}
          onViewApplications={handleViewApplications}
          router={router}
          noResultsMessage="No interviews scheduled for this drive yet."
          scopeLabel="This drive only"
          jobIdIsRouteScope
        />
      </div>
    </JobsErrorBoundary>
  );
}

SuperAdminDriveInterviewsPage.superAdminLayout = SuperAdminLayout;
