import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "antd";
import SemesterCourseMapping from "../superadmin/sections/SemesterCourseMapping";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminSemesterCourses() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("semester-courses"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage semester-course mapping. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module">
      <AdminGroupShell groupKey="academic">
        <SemesterCourseMapping collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminSemesterCourses.adminLayout = AdminLayout;
