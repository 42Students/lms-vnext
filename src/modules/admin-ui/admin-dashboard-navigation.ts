/**
 * W06 clone-first College Admin Dashboard navigation contract.
 * Legacy source: lms2-fe/prod-2026,
 * src/components/admin/dashboard/config.js and college-admin/dashboard.js.
 *
 * A null href means the exact legacy job is NOT yet ported.
 * Never quietly map "Faculty" to a generic People table, or "Semesters" to
 * Academics, unless the original workflow/tab is actually available.
 */
export const COLLEGE_ADMIN_QUICK_ACTIONS = [
  { key: "departments", label: "Departments", href: "/college/departments" },
  { key: "course-list", label: "Courses", href: "/college/courses" },
  { key: "programs", label: "Programs", href: "/college/programs" },
  { key: "faculty", label: "Faculty", href: "/college/faculty" },
  { key: "students", label: "Students", href: "/college/students" },
  { key: "jobs", label: "Jobs", href: "/college/placements" },
  { key: "hiring-dashboard", label: "Hiring Dashboard", href: "/college/hiring-dashboard" },
  { key: "attendance", label: "Attendance", href: "/college/attendance" },
  { key: "assignments", label: "Assignments", href: "/college/assignments" },
  { key: "quizzes", label: "Quizzes", href: "/college/quizzes" },
  { key: "people", label: "People Directory", href: "/college/people" },
] as const;

/** Exact legacy copy of SetupGuide.js and AdminDashboardView.js (lms-dev-2026). */
export const COLLEGE_SETUP_GUIDE_COPY = {
  collapseLabel: "Setting up a new college? Step-by-step setup guide",
  heading: "Setup Guide (Follow in Order)",
  intro:
    "If you're setting up the LMS for the first time, follow these phases in order. Each phase depends on the previous one being completed.",
} as const;

export const COLLEGE_ADMIN_SETUP_PHASES = [
  {
    title: "Structure",
    steps: [
      { label: "Create Departments", key: "departments", href: "/college/departments", desc: "Academic departments" },
    ],
  },
  {
    title: "Courses",
    steps: [
      { label: "Create Courses", key: "course-list", href: "/college/courses", desc: "Add the subjects you teach (needs a department)" },
      { label: "Add Lessons", key: "lessons", href: "/college/lessons", desc: "Create lessons for courses" },
      { label: "Add Lesson Content", key: "lesson-content", href: "/college/videos", desc: "Videos, resources and live classes" },
    ],
  },
  {
    title: "Academic Structure",
    steps: [
      { label: "Set up Programs", key: "programs", href: "/college/programs", desc: "Degree programs (B.Tech, MBA)" },
      { label: "Create Semesters", key: "semesters", href: "/college/semesters", desc: "Semesters within programs" },
      { label: "Map courses to semesters", key: "semester-courses", href: "/college/semester-courses", desc: "Which courses each semester teaches" },
      { label: "Set up Academic Periods", key: "academic-periods", href: "/college/academics",
        desc: "Required before creating batches, classes or elective offerings" },
      { label: "Create Batches", key: "batches", href: "/college/batches", desc: "Year batches (2024-2028)" },
      { label: "Create Classes", key: "classes", href: "/college/classes", desc: "Sections within each batch (e.g. CSE - A)" },
    ],
  },
  {
    title: "People",
    steps: [
      { label: "Add Faculty", key: "faculty", href: "/college/faculty", desc: "Teaching staff accounts" },
      { label: "Assign Faculty", key: "faculty-assignment", href: "/college/faculty-assignment", desc: "Who teaches which course for which section" },
      { label: "Add Students", key: "students", href: "/college/students", desc: "Student accounts, placed in a section" },
    ],
  },
  {
    title: "Lecture Halls & Jobs (Optional)",
    steps: [
      { label: "Add Lecture Halls", key: "lecture-halls", href: "/college/lecture-halls", desc: "Rooms used in the timetable" },
      { label: "Jobs & Placements", key: "jobs", href: "/college/placements", desc: "Post and manage job openings" },
    ],
  },
] as const;

/** Legacy Super Admin dropped the big setup guide by deliberate decision. */
/** SA-tenants-modules-04: four unscoped platform choices, not college-specific setup. */
export const SUPER_ADMIN_GLOBAL_LINKS = [
  { label: "Tenant Setup", href: "/admin/tenants", subtitle: "Create and manage organizations and colleges before choosing a scope." },
  { label: "Recruiter accounts", href: "/admin/recruiters", subtitle: "Inspect recruiter access and account records across the platform." },
  { label: "Feature Controls", href: "/admin/features", subtitle: "Review platform features and access controls." },
  { label: "Activity Log", href: "/admin/audit", subtitle: "Review activity across the platform within your permissions." },
] as const;

export const SUPER_ADMIN_COLLEGE_QUICK_ACTIONS=[
 {label:"Departments",href:"/admin/departments"},
 {label:"Courses",href:"/admin/courses"},
 {label:"Programs",href:"/admin/programs"},
 {label:"Faculty",href:"/admin/faculty"},
 {label:"Students",href:"/admin/students"},
 {label:"Jobs",href:"/admin/placements"},
 {label:"Hiring Dashboard",href:"/admin/placements/analytics"},
 {label:"Attendance",href:"/admin/attendance"},
 {label:"Assignments",href:"/admin/assignments"},
 {label:"Quizzes",href:"/admin/quizzes"},
 {label:"People Directory",href:"/admin/people"},
] as const;

/** Dedicated college-scoped Super Admin shortcuts, not a restored setup guide. */
export const SUPER_ADMIN_COLLEGE_LINKS = [
  { label: "Tenant Setup", href: "/admin/tenants/setup?tab=setup" },
  { label: "Academic Setup", href: "/admin/academics" },
  { label: "Courses & Content", href: "/admin/courses" },
  { label: "People", href: "/admin/people" },
  { label: "Placements", href: "/admin/placements" },
  { label: "Project Templates", href: "/admin/projects/templates" },
  { label: "Profile verification", href: "/admin/verification" },
  { label: "Audit Findings", href: "/tracker/audit-findings" },
] as const;
