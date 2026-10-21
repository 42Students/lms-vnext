import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "antd";
import FacultyAssignment from "../superadmin/sections/FacultyAssignment";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminFacultyAssignment() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("faculty-assignment"));
  }, [dispatch]);

  const collegeId = loginUser?.collegeId ?? null;

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage faculty assignment. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <AdminGroupShell groupKey="people">
        <FacultyAssignment collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminFacultyAssignment.adminLayout = AdminLayout;
