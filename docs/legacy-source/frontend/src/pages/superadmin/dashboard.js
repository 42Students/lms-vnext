import { useRouter } from "next/router";
import Dashboard from "./sections/Dashboard";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import PageShell from "@/components/Common/PageShell";

// Dashboard's Quick Action / Setup Guide cards emit the OLD SPA's bare section keys (e.g.
// "course-list", "tenants") via onNavigate — map each to its real route under the new per-page
// structure. Keys not listed here (defensively) just no-op rather than throwing.
const ROUTE_MAP = {
  tenants: "/superadmin/tenants",
  features: "/superadmin/features",
  settings: "/superadmin/settings",
  "deleted-items": "/superadmin/deleted-items",
  departments: "/superadmin/departments",
  "course-list": "/superadmin/courses",
  programs: "/superadmin/programs",
  faculty: "/superadmin/teachers",
  students: "/superadmin/students",
  lessons: "/superadmin/lessons",
  "lesson-content": "/superadmin/lesson-content",
  semesters: "/superadmin/semesters",
  "semester-courses": "/superadmin/semester-courses",
  batches: "/superadmin/batches",
  classes: "/superadmin/classes",
  "batch-promotion": "/superadmin/batch-promotion",
  "faculty-assignment": "/superadmin/faculty-assignment",
  "lecture-halls": "/superadmin/lecture-halls",
  attendance: "/superadmin/attendance",
  assignments: "/superadmin/assignments",
  quizzes: "/superadmin/quizzes",
  people: "/superadmin/people",
  jobs: "/superadmin/jobs",
  "hiring-dashboard": "/superadmin/hiring-dashboard",
  audit: "/superadmin/audit",
  recruiters: "/superadmin/recruiters",
  // Points at the Templates tab, the Projects group's landing page for this panel. There is no
  // /superadmin/projects overview page any more — it summarised its own sibling tabs and gave the
  // screen no single job.
  projects: "/superadmin/projects/templates",
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { selectedCollegeId } = useSuperAdminScope();

  const onNavigate = (key) => {
    const path = ROUTE_MAP[key];
    if (path) router.push(path);
  };

  return (
    <div className="ln-module admin-list-page">
      <PageShell title="Dashboard">
        <Dashboard
          onNavigate={onNavigate}
          collegeId={selectedCollegeId}
          isCollegeScoped={selectedCollegeId != null}
        />
      </PageShell>
    </div>
  );
}

SuperAdminDashboard.superAdminLayout = SuperAdminLayout;
