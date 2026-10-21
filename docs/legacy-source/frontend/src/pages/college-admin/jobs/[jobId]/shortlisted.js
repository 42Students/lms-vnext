import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Alert } from "antd";
import JobApplications from "../../../superadmin/sections/JobApplications";
import AdminLayout from "@/layouts/AdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import DriveSubNav from "@/components/admin/placements/DriveSubNav";
import ModuleGroupGuard from "@/components/admin/ModuleGroupGuard";

/**
 * College admin view for shortlisted pipeline: Assessment, Interviews, Offers.
 * collegeId always comes from the authenticated admin's own assignment — never
 * from the URL, which would let an unassigned/mismatched admin reach another
 * college's pipeline just by editing the query string.
 */
export default function AdminJobShortlistedPage() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage the shortlisted pipeline. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <JobsErrorBoundary onBack={() => router.push("/college-admin/jobs")}>
      <div className="ln-module admin-list-page placements-page">
        {/* See applications.js for why this needs its own ModuleGroupGuard — no shared shell
            gates this page the way AdminGroupShell does for the list-level Placements pages. */}
        <ModuleGroupGuard groupKey="placements">
          {/* active="applications" is intentional, not a missing "shortlisted" tab: DriveSubNav's
              SECTIONS has no shortlisted entry because Shortlisted is reached as a sub-view *from*
              Applications (via the "Manage Shortlisted" button in JobApplications.js), not as its
              own peer top-level tab — so highlighting "Applications" here is correct. */}
          <DriveSubNav jobId={router.query.jobId} active="applications" basePath="/college-admin" />
          <JobApplications
            jobType="lms"
            fortyTwoLearnId={null}
            collegeId={collegeId}
            basePath="/college-admin"
            shortlistedMode
          />
        </ModuleGroupGuard>
      </div>
    </JobsErrorBoundary>
  );
}

AdminJobShortlistedPage.adminLayout = AdminLayout;
