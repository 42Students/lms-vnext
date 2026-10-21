import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { Alert } from "antd";
import AdminLayout from "@/layouts/AdminLayout";
import { AdminDashboardView } from "@/components/admin/dashboard";
import { appAction } from "@/redux/store";
import PageShell from "@/components/Common/PageShell";

const ADMIN_ROUTE_MAP = {
  departments: "/college-admin/departments",
  "course-list": "/college-admin/courses",
  programs: "/college-admin/programs",
  faculty: "/college-admin/teachers",
  students: "/college-admin/students",
  lessons: "/college-admin/lessons",
  "lesson-content": "/college-admin/lesson-content",
  semesters: "/college-admin/semesters",
  "semester-courses": "/college-admin/semester-courses",
  batches: "/college-admin/batches",
  classes: "/college-admin/classes",
  "batch-promotion": "/college-admin/batch-promotion",
  "faculty-assignment": "/college-admin/faculty-assignment",
  "lecture-halls": "/college-admin/lecture-halls",
  jobs: "/college-admin/jobs",
  "hiring-dashboard": "/college-admin/hiring-dashboard",
  attendance: "/college-admin/attendance",
  assignments: "/college-admin/assignments",
  quizzes: "/college-admin/quizzes",
  people: "/college-admin/people",
};

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("dashboard"));
  }, [dispatch]);

  const collegeId = loginUser?.collegeId ?? null;
  const isCollegeScoped = !!collegeId;

  const onNavigate = (key) => {
    const path = ADMIN_ROUTE_MAP[key];
    if (path) router.push(path);
  };

  return (
    <div className="ln-module admin-dashboard-page-wrapper">
      <PageShell title="Dashboard">
        {!collegeId && (
          <Alert
            type="warning"
            message="Admin not assigned to a college"
            description="Some features are limited. Contact your administrator to assign this account to a college."
            showIcon
            className="admin-dashboard-no-college-alert"
            style={{ marginBottom: 16 }}
          />
        )}
        <AdminDashboardView
          onNavigate={onNavigate}
          collegeId={collegeId}
          isCollegeScoped={isCollegeScoped}
        />
      </PageShell>
    </div>
  );
}

AdminDashboard.adminLayout = AdminLayout;
