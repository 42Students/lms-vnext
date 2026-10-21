import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Alert } from "antd";
import JobApplications from "../../../superadmin/sections/JobApplications";
import AdminLayout from "@/layouts/AdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";
import ModuleGroupGuard from "@/components/admin/ModuleGroupGuard";

/**
 * College admin view for job applications. collegeId always comes from the
 * authenticated admin's own assignment — a URL/query collegeId is never trusted,
 * since that would let an admin with no (or a different) college assignment
 * view/mutate another college's application data just by editing the URL.
 */
export default function AdminJobApplicationsPage() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage job applications. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <JobsErrorBoundary onBack={() => router.push("/college-admin/jobs")}>
      <div className="ln-module admin-list-page placements-page">
        {/* The list-level Placements pages gate on Placements being enabled via AdminGroupShell;
            this detail page (and its siblings) has no such shell, so a bookmarked/emailed link
            could reach it directly even with the module off. Guard explicitly here instead. */}
        <ModuleGroupGuard groupKey="placements">
          <DriveSubNav jobId={router.query.jobId} active="applications" basePath="/college-admin" />
          <JobApplications
            jobType="lms"
            fortyTwoLearnId={null}
            collegeId={collegeId}
            basePath="/college-admin"
          />
        </ModuleGroupGuard>
      </div>
    </JobsErrorBoundary>
  );
}

AdminJobApplicationsPage.adminLayout = AdminLayout;
