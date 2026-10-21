import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Alert } from "antd";
import Jobs from "../../superadmin/sections/Jobs";
import AdminLayout from "@/layouts/AdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

/**
 * The full flat drive table (every drive, active or not) — kept as a secondary, quieter view
 * behind a link from the Drives landing page, rather than deleting it. The landing page's card
 * grid is the primary experience now; this is the escape hatch for "show me everything."
 */
export default function AdminAllJobs() {
  const loginUser = useSelector((state) => state.loginUser);
  const dispatch = useDispatch();
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("jobs"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage jobs. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <JobsErrorBoundary>
      <div className="ln-module admin-list-page placements-page">
        <AdminGroupShell groupKey="placements">
          <Jobs collegeId={collegeId} basePath="/college-admin" />
        </AdminGroupShell>
      </div>
    </JobsErrorBoundary>
  );
}

AdminAllJobs.adminLayout = AdminLayout;
