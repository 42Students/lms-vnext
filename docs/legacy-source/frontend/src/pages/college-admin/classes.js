import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "antd";
import Classes from "../superadmin/sections/Classes";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminClasses() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("classes"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage classes. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module">
      <AdminGroupShell groupKey="academic">
        <Classes collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminClasses.adminLayout = AdminLayout;
