import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Alert } from "antd";
import LessonContent from "../superadmin/sections/LessonContent";
import AdminResources from "../superadmin/sections/AdminResources";
import AdminLayout from "@/layouts/AdminLayout";
import AdminGroupShell from "@/components/admin/AdminGroupShell";
import { appAction } from "@/redux/store";

export default function AdminLessonContent() {
  const dispatch = useDispatch();
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const collegeId = loginUser?.collegeId ?? null;

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("lesson-content"));
  }, [dispatch]);

  if (collegeId == null) {
    return (
      <div className="ln-module admin-list-page">
        <Alert
          type="warning"
          message="Admin not assigned to a college"
          description="You must be assigned to a college to view and manage lesson content. Contact your administrator."
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }
  return (
    <div className="ln-module admin-list-page">
      <AdminGroupShell groupKey="content">
        {router.query.type === "resources"
          ? <AdminResources collegeId={collegeId} />
          : <LessonContent collegeId={collegeId} showPlatformPolicy={false} />}
      </AdminGroupShell>
    </div>
  );
}

AdminLessonContent.adminLayout = AdminLayout;
