import { useSelector } from "react-redux";
import { Alert } from "antd";
import PeopleDirectory from "../superadmin/sections/PeopleDirectory";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";

export default function AdminPeopleDirectory() {
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to browse the directory. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <AdminGroupShell groupKey="people">
        <PeopleDirectory collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminPeopleDirectory.adminLayout = AdminLayout;
