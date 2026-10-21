import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "antd";
import SemesterManagement from "../superadmin/sections/SemesterManagement";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminSemesters() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("semesters"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage semesters. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <AdminGroupShell groupKey="academic">
        <SemesterManagement collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminSemesters.adminLayout = AdminLayout;
