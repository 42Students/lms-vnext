import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Alert } from "antd";
import AdminLayout from "@/layouts/AdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";
import InterviewCalendarContent from "@/components/InterviewCalendar/InterviewCalendarContent";
import ModuleGroupGuard from "@/components/admin/ModuleGroupGuard";

/**
 * A drive's own schedule — InterviewCalendarContent already deep-links off a `jobId` query
 * param, and the dynamic route segment fills that in automatically, so no extra filtering wiring
 * is needed here.
 */
export default function AdminDriveInterviewsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  const handleViewApplications = (jid) => {
    if (!jid) return;
    router.push(`/college-admin/jobs/${jid}/applications`);
  };

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert type="warning" message="Admin not assigned to a college" showIcon />
      </div>
    );
  }

  return (
    <JobsErrorBoundary onBack={() => router.push("/college-admin/jobs")}>
      <div className="ln-module admin-list-page placements-page">
        {/* See jobs/[jobId]/applications.js for why this needs its own ModuleGroupGuard. */}
        <ModuleGroupGuard groupKey="placements">
          <DriveSubNav jobId={jobId} active="interviews" basePath="/college-admin" />
          <InterviewCalendarContent
            organizationId={collegeId}
            onViewApplications={handleViewApplications}
            router={router}
            noResultsMessage="No interviews scheduled for this drive yet."
            scopeLabel="This drive only"
            jobIdIsRouteScope
          />
        </ModuleGroupGuard>
      </div>
    </JobsErrorBoundary>
  );
}

AdminDriveInterviewsPage.adminLayout = AdminLayout;
