/**
 * W06 clone-first College Admin Dashboard navigation contract.
 * Legacy source: lms2-fe/prod-2026,
 * src/components/admin/dashboard/config.js and college-admin/dashboard.js.
 *
 * A null href deliberately means the exact legacy job is NOT yet ported.
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
  { key: "hiring-dashboard", label: "Hiring Dashboard", href: null },
  { key: "attendance", label: "Attendance", href: null },
  { key: "assignments", label: "Assignments", href: "/college/assignments" },
  { key: "quizzes", label: "Quizzes", href: "/college/quizzes" },
  { key: "people", label: "People Directory", href: null },
] as const;

export const COLLEGE_ADMIN_SETUP_PHASES = [
  {
    title: "Structure",
    steps: [
      { label: "Create Departments", key: "departments", href: "/college/departments" },
    ],
  },
  {
    title: "Courses",
    steps: [
      { label: "Create Courses", key: "course-list", href: "/college/courses" },
      { label: "Add Lessons", key: "lessons", href: null },
      { label: "Add Lesson Content", key: "lesson-content", href: null },
    ],
  },
  {
    title: "Academic Structure",
    steps: [
      { label: "Setup Programs", key: "programs", href: "/college/programs" },
      { label: "Create Semesters", key: "semesters", href: null },
      { label: "Map Semester-Courses", key: "semester-courses", href: null },
      { label: "Create Batches", key: "batches", href: null },
      { label: "Create Classes", key: "classes", href: null },
    ],
  },
  {
    title: "People",
    steps: [
      { label: "Register Faculty", key: "faculty", href: null },
      { label: "Assign Faculty", key: "faculty-assignment", href: "/college/faculty-assignment" },
      { label: "Register Students", key: "students", href: null },
    ],
  },
  {
    title: "Lecture Halls & Jobs (Optional)",
    steps: [
      { label: "Add Lecture Halls", key: "lecture-halls", href: "/college/lecture-halls" },
      { label: "Jobs & Placements", key: "jobs", href: "/college/placements" },
    ],
  },
] as const;

/** Legacy Super Admin dropped the big setup guide by deliberate decision. */
export const SUPER_ADMIN_GLOBAL_LINKS = [
  { label: "Tenant Setup", href: "/admin/tenants/setup" },
  { label: "Feature Controls", href: "/admin/features" },
  { label: "Activity Log", href: "/admin/audit" },
] as const;

/** Dedicated college-scoped Super Admin shortcuts, not a restored setup guide. */
export const SUPER_ADMIN_COLLEGE_LINKS = [
  { label: "Tenant Setup", href: "/admin/tenants/setup?tab=setup" },
  { label: "Academic Setup", href: "/admin/academics" },
  { label: "Courses & Content", href: "/admin/courses" },
  { label: "People", href: "/admin/people" },
  { label: "Placements", href: "/admin/placements" },
  { label: "Project Templates", href: "/admin/projects/templates" },
  { label: "Profile Verification", href: "/admin/verification" },
  { label: "Audit Findings", href: "/tracker/audit-findings" },
] as const;
