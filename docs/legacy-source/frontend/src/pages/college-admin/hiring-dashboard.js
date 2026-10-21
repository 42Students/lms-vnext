/**
 * College Admin Hiring Dashboard - Phase 6 (from Phase 5 review)
 * Metrics, funnel, and company-wise report for the admin's college.
 */
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Alert } from "antd";
import AdminLayout from "@/layouts/AdminLayout";
import HiringDashboard from "@/pages/superadmin/sections/HiringDashboard";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminHiringDashboard() {
  const loginUser = useSelector((state) => state.loginUser);
  const dispatch = useDispatch();
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    // "jobs" (not "hiring-dashboard") — the sidebar has one unified "Placements" entry now.
    dispatch(appAction.setActiveMenuItem("jobs"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view hiring metrics. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page placements-page">
      <AdminGroupShell groupKey="placements">
        <HiringDashboard adminMode="lms" collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminHiringDashboard.adminLayout = AdminLayout;
