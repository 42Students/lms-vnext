import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { Alert } from "antd";
import InterviewCalendarContent from "@/components/InterviewCalendar/InterviewCalendarContent";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

const AdminCalendar = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);

  useEffect(() => {
    // "jobs" (not "calendar") — the sidebar has one unified "Placements" entry now.
    dispatch(appAction.setActiveMenuItem("jobs"));
  }, [dispatch]);
  // BE-0200: the scope is the admin's own college or organization, never a collegeId typed into the address bar.
  const organizationId = loginUser?.collegeId ?? loginUser?.organizationId ?? null;

  const handleViewApplications = (jobId, job) => {
    if (!jobId) return;
    const collegeIdForUrl = job?.collegeId ?? organizationId;
    if (!collegeIdForUrl) return;
    const params = `?collegeId=${collegeIdForUrl}`;
    router.push(`/college-admin/jobs/${jobId}/applications${params}`);
  };

  if (organizationId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view interviews. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page placements-page">
      <AdminGroupShell groupKey="placements">
        <InterviewCalendarContent
          organizationId={organizationId}
          onViewApplications={handleViewApplications}
          router={router}
          emptyMessage="Assign this admin to an organization or college to view interviews."
          scopeLabel="All companies"
          jobIdIsRouteScope={false}
        />
      </AdminGroupShell>
    </div>
  );
};

export default AdminCalendar;
AdminCalendar.adminLayout = AdminLayout;
