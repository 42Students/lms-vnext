import { useSelector } from "react-redux";
import { Alert } from "antd";
import Quizzes from "../superadmin/sections/Quizzes";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";

export default function AdminQuizzes() {
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to manage quizzes. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <AdminGroupShell groupKey="content">
        <Quizzes collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminQuizzes.adminLayout = AdminLayout;
