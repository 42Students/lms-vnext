import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Alert } from "antd";
import CourseProgress from "../superadmin/sections/CourseProgress";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

// The content nav group is shared with the super-admin console, so adding the Progress tab there
// added it here too. Without this page that tab was a link to nothing — the same class of
// dead-end the audits keep finding, created by the fix for one of them.
export default function AdminCourseProgress() {
  const loginUser = useSelector((state) => state.loginUser);
  const dispatch = useDispatch();
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("courses"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view course progress. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <AdminGroupShell groupKey="content">
        <CourseProgress collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminCourseProgress.adminLayout = AdminLayout;
