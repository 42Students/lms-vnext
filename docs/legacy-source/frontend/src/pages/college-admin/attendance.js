import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "antd";
import Attendance from "../superadmin/sections/Attendance";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

// This route already existed in the sidebar nav config (adminNavigationMenuFlat's "attendance"
// entry, common/lists.js) with no page behind it — clicking it 404'd. This is that missing page.
export default function AdminAttendance() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("attendance"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view attendance. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module">
      <AdminGroupShell groupKey="academic">
        <Attendance collegeId={collegeId} />
      </AdminGroupShell>
    </div>
  );
}

AdminAttendance.adminLayout = AdminLayout;
