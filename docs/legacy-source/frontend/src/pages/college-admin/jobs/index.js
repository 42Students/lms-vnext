import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Alert } from "antd";
import DrivesLanding from "../../superadmin/sections/DrivesLanding";
import AdminLayout from "@/layouts/AdminLayout";
import JobsErrorBoundary from "@/components/ErrorBoundary/JobsErrorBoundary";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminJobs() {
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
          <DrivesLanding collegeId={collegeId} basePath="/college-admin" />
        </AdminGroupShell>
      </div>
    </JobsErrorBoundary>
  );
}

AdminJobs.adminLayout = AdminLayout;
