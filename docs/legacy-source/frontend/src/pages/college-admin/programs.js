import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Alert } from "antd";
import Programs from "../superadmin/sections/Programs";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminPrograms() {
  const loginUser = useSelector((state) => state.loginUser);
  const dispatch = useDispatch();
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("programs"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage programs. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <AdminGroupShell groupKey="academic">
        <Programs collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminPrograms.adminLayout = AdminLayout;
