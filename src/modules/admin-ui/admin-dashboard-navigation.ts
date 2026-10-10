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
  { key: "faculty", label: "Faculty", href: null },
  { key: "students", label: "Students", href: null },
  { key: "jobs", label: "Jobs", href: "/college/placements" },
  { key: "hiring-dashboard", label: "Hiring Dashboard", href: null },
  { key: "attendance", label: "Attendance", href: null },
  { key: "assignments", label: "Assignments", href: null },
  { key: "quizzes", label: "Quizzes", href: null },
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
      { label: "Assign Faculty", key: "faculty-assignment", href: null },
      { label: "Register Students", key: "students", href: null },
    ],
  },
  {
    title: "Lecture Halls & Jobs (Optional)",
    steps: [
      { label: "Add Lecture Halls", key: "lecture-halls", href: null },
      { label: "Jobs & Placements", key: "jobs", href: "/college/placements" },
    ],
  },
] as const;

/** Legacy Super Admin dropped the big setup guide by deliberate decision. */
export const SUPER_ADMIN_GLOBAL_LINKS = [
  { label: "Tenant Setup", href: null },
  { label: "Feature Controls", href: null },
  { label: "Activity Log", href: "/activity" },
] as const;
