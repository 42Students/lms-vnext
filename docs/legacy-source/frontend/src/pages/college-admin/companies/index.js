import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Alert } from "antd";
import Companies from "../../superadmin/sections/Companies";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminCompanies() {
  const loginUser = useSelector((state) => state.loginUser);
  const dispatch = useDispatch();
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    // "jobs" — the sidebar has one unified "Placements" entry covering this whole module.
    dispatch(appAction.setActiveMenuItem("jobs"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page placements-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to manage companies. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page placements-page">
      <AdminGroupShell groupKey="placements">
        <Companies collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminCompanies.adminLayout = AdminLayout;
