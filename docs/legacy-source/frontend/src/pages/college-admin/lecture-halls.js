import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "antd";
import LectureHalls from "../superadmin/sections/LectureHalls";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminLectureHalls() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("lecture-halls"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage lecture halls. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module">
      <AdminGroupShell groupKey="academic">
        <LectureHalls collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminLectureHalls.adminLayout = AdminLayout;
