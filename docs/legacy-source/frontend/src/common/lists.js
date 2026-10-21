export const teacherNavigationMenu = (props) => [
  {
    modulename: "Courses",
    path: "courses",
    group: "teaching",
    icon:
      props?.id === "courses"
        ? "/assets/images/common/course.svg"
        : "/assets/images/common/courses.svg",
  },
  {
    modulename: "Contacts",
    path: "contacts",
    group: "teaching",
    icon: "/assets/images/common/contact.svg",
  },
  {
    modulename: "Notifications",
    path: "notifications",
    group: "teaching",
    icon: "/assets/images/common/notification.svg",
  },
  {
    modulename: "Class Schedule",
    path: "calendar",
    group: "teaching",
    icon: "/assets/images/common/calender.svg",
  },
  {
    modulename: "All Quizzes",
    path: "allQuizzes",
    group: "teaching",
    icon:
      props?.id === "allQuizzes"
        ? "/assets/images/common/quiz-active.svg"
        : "/assets/images/common/quiz.svg",
  },
  {
    modulename: "All assignments",
    path: "allAssignments",
    group: "teaching",
    icon:
      props?.id === "allAssignments"
        ? "/assets/images/common/assignment-active.svg"
        : "/assets/images/common/assignment.svg",
  },
  {
    modulename: "Profile",
    path: "profile",
    group: "account",
    icon: "/assets/images/common/myAccount.svg",
  },
];

export const studentNavigationMenu = (props) => [
  // ── Learning (daily workflow) ───────────────────────────
  {
    modulename: "Courses",
    path: "courses",
    group: "learning",
    icon:
      props?.id === "courses"
        ? "/assets/images/common/course.svg"
        : "/assets/images/common/courses.svg",
  },
  {
    modulename: "Quizzes",
    path: "allQuizzes",
    group: "learning",
    icon:
      props?.id === "allQuizzes"
        ? "/assets/images/common/quiz-active.svg"
        : "/assets/images/common/quiz.svg",
  },
  {
    modulename: "Assignments",
    path: "allAssignments",
    group: "learning",
    icon:
      props?.id === "allAssignments"
        ? "/assets/images/common/assignment-active.svg"
        : "/assets/images/common/assignment.svg",
  },
  // ── Tracking (periodic check-ins) ──────────────────────
  {
    modulename: "Class Schedule",
    path: "calendar",
    group: "tracking",
    icon: "/assets/images/common/calender.svg",
  },
  {
    modulename: "Attendance",
    path: "attendance",
    group: "tracking",
    icon: "/assets/images/common/attendance.svg",
  },
  // ── Career (placement) ──────────────────────────────────
  {
    modulename: "My Placements",
    path: "my-placements",
    group: "career",
    icon: "/assets/images/common/book-open.svg",
  },
  {
    modulename: "Projects",
    path: "projects",
    group: "learning",
    icon: "/assets/images/common/folder.svg",
  },
  // ── Utility & Account ──────────────────────────────────
  {
    modulename: "Notifications",
    path: "notifications",
    group: "account",
    icon: "/assets/images/common/notification.svg",
  },
  {
    modulename: "Profile",
    path: "profile",
    group: "account",
    icon: "/assets/images/common/myAccount.svg",
  },
];

export const adminNavigationMenu = [
  {
    label: "Dashboard",
    modulename: "dashboard",
    icon: "/assets/images/common/analytics.svg",
  },
  {
    label: "Departments",
    modulename: "departments",
    icon: "/assets/images/common/folder.svg",
  },
  {
    label: "Courses",
    icon: "/assets/images/common/course.svg",
    children: [
      { label: "Courses", modulename: "courses" },
      { label: "Lessons", modulename: "lessons" },
      { label: "Lesson Content", modulename: "lesson-content" },
    ],
  },
  {
    label: "Academic Structure",
    icon: "/assets/images/common/book-open.svg",
    children: [
      { label: "Programs", modulename: "programs" },
      { label: "Semesters", modulename: "semesters" },
      { label: "Semester-Course Mapping", modulename: "semester-courses" },
      { label: "Batches", modulename: "batches" },
      { label: "Classes", modulename: "classes" },
      { label: "Batch Promotion", modulename: "batch-promotion" },
      { label: "Lecture Halls", modulename: "lecture-halls" },
    ],
  },
  {
    label: "User Management",
    icon: "/assets/images/common/existing-student.svg",
    children: [
      { label: "Faculty", modulename: "teachers" },
      { label: "Faculty Assignment", modulename: "faculty-assignment" },
      { label: "Students", modulename: "students" },
    ],
  },
  {
    label: "Jobs",
    modulename: "jobs",
    icon: "/assets/images/common/assignment.svg",
  },
  {
    label: "Calendar",
    modulename: "calendar",
    icon: "/assets/images/common/calender.svg",
  },
  {
    label: "Profile",
    modulename: "profile",
    icon: "/assets/images/common/myAccount.svg",
  },
];

/**
 * Flat admin menu for sidebar. path = modulename for routing.
 * icon = Ant Design icon name (from @ant-design/icons) – unique and intent-matched.
 * Rendered in AdminSidebar via adminSidebarIconMap.
 */
// Collapsed from ~28 flat rows down to 8 — 3 standalone pages plus 5 groups, each opening into a
// horizontal PageShell tab strip (see src/common/adminNavGroups.js for the group -> member-page
// mapping). Each grouped row's `path` is that group's default landing page.
export const adminNavigationMenuFlat = () => [
  { modulename: "Dashboard", path: "dashboard", icon: "DashboardOutlined" },
  { modulename: "Activity Log", path: "audit", icon: "HistoryOutlined" },
  { modulename: "Academic Setup", path: "departments", icon: "ApartmentOutlined" },
  { modulename: "Courses & Content", path: "courses", icon: "BookOutlined" },
  { modulename: "People", path: "teachers", icon: "UsergroupAddOutlined" },
  { modulename: "Profile verification", path: "verification", icon: "SafetyCertificateOutlined" },
  // Single entry for the whole Placements module (Jobs, Hiring Dashboard, Interview Calendar) —
  // those used to be three separate sidebar items; they're now one section reached via a
  // horizontal sub-nav (see PlacementsSubNav) so the sidebar doesn't fragment one module into
  // three unrelated-looking rows. getSidebarActiveKey maps all three routes back to "jobs" so
  // this entry stays highlighted no matter which placements page is open.
  { modulename: "Placements", path: "jobs", icon: "SolutionOutlined" },
  // The placement cell workspace (TPO V1). Where a college has no TPO account the college admin acts as TPO admin, so it is always here.
  { modulename: "Placement cell", path: "placement-cell", href: "/tpo/home", icon: "TeamOutlined" },
  // Points at the group's landing tab rather than a bare "projects" route: the Projects group no
  // longer has an overview page, and college-admin's day starts at the live workspaces. The path
  // must equal groupDefaultPath("projects") or getSidebarActiveKey stops highlighting this row.
  { modulename: "Projects", path: "projects/workspaces", icon: "FolderOutlined" },
  { modulename: "Profile", path: "profile", icon: "IdcardOutlined" },
];

/** Admin sidebar menu with dividers for grouping (Dashboard/Activity Log | Academic/Content/People | Placements/Projects | Profile). */
export const adminNavigationMenuForSidebar = () => {
  const flat = adminNavigationMenuFlat();
  const withDividers = [];
  const dividerAfterPaths = ["audit", "teachers", "projects/workspaces"];
  flat.forEach((item, i) => {
    withDividers.push(item);
    if (dividerAfterPaths.includes(item.path) && i < flat.length - 1) {
      withDividers.push({ divider: true });
    }
  });
  return withDividers;
};

// Superadmin panel — the same 5 grouped rows as adminNavigationMenuFlat and the same
// GroupShell/PageShell tab pattern, under /superadmin instead of /college-admin, plus the
// platform-wide rows only superadmin has (see SUPER_ADMIN_STANDALONE_PAGES).
//
// The Projects row's path deliberately DIFFERS between the two panels: each lands on its own
// first tab (Templates here, Workspaces for college-admin). That is not drift to be tidied up.
export const superAdminNavigationMenuFlat = () => [
  { modulename: "Overview", path: "dashboard", icon: "DashboardOutlined" },
  { modulename: "Tenant Setup", path: "tenants", icon: "BankOutlined" },
  { modulename: "Feature Controls", path: "features", icon: "AppstoreOutlined" },
  // Feature Controls is the whole-college on/off; this is the same three modules resolved down
  // the hierarchy (department / program / batch / class / student).
  { modulename: "Module Access", path: "module-access", icon: "PartitionOutlined" },
  { modulename: "Tenant Settings", path: "settings", icon: "SettingOutlined" },
  { modulename: "Activity Log", path: "audit", icon: "HistoryOutlined" },
  // Every email sent to a 42lms.com address (Cloudflare Email Routing), platform-wide.
  { modulename: "Inbound mail", path: "inbound-mail", icon: "MailOutlined" },
  { modulename: "Academic Setup", path: "departments", icon: "ApartmentOutlined" },
  { modulename: "Courses & Content", path: "courses", icon: "BookOutlined" },
  { modulename: "People", path: "teachers", icon: "UsergroupAddOutlined" },
  // Industry recruiters: one identity across colleges, managed only here (docs/recruiter-tpo).
  { modulename: "Profile verification", path: "verification", icon: "SafetyCertificateOutlined" },
  { modulename: "Placements", path: "jobs", icon: "SolutionOutlined" },
  // Recruiter accounts and Announcements (42 to placement cells) are tabs of Placements (SUPER_ADMIN_PLACEMENTS_GROUP).
  // Superadmin's landing tab is Templates, not Workspaces: authoring the catalog and assigning it
  // to colleges is the job here, where college-admin's is running live projects. Must equal
  // superAdminGroupDefaultPath("projects") for the sidebar row to stay highlighted.
  { modulename: "Projects", path: "projects/templates", icon: "FolderOutlined" },
];

export const superAdminNavigationMenuForSidebar = () => {
  const flat = superAdminNavigationMenuFlat();
  const withDividers = [];
  const dividerAfterPaths = ["features", "inbound-mail", "teachers"];
  flat.forEach((item, i) => {
    withDividers.push(item);
    if (dividerAfterPaths.includes(item.path) && i < flat.length - 1) {
      withDividers.push({ divider: true });
    }
  });
  return withDividers;
};

export const courseTabList = [
  {
    key: "1",
    label: "Overview",
    path: "home",
  },
  {
    key: "2",
    label: "Blueprint",
    path: "blueprint",
    roles: ["FACULTY", "ADMIN"],
  },
  {
    key: "2a",
    label: "Learning Path",
    path: "roadmap",
    roles: ["LEARNER"],
  },
  {
    key: "6",
    label: "Attendance",
    path: "attendanceDetail",
  },
  {
    key: "8",
    // Was "Chat" — the page itself (Classroom.js), its own heading, subtitle, and the URL
    // segment all call this "Discussions". A tab labeled differently from the page it opens
    // reads as a broken link, and CourseTabsLayout composes the browser tab title from this
    // label too ("{course} · Chat"), disagreeing with what the page shows.
    label: "Discussions",
    path: "discussions",
  },
  {
    key: "9",
    label: "Students",
    path: "students",
    roles: ["FACULTY", "ADMIN"],
  },
];

export const mentorNavigationMenu = (props) => [
  {
    modulename: "Projects",
    path: "projects",
    group: "learning",
    icon:
      props?.id === "projects"
        ? "/assets/images/common/folder.svg"
        : "/assets/images/common/folder.svg",
  },
  {
    modulename: "Meetings",
    path: "calendar",
    group: "learning",
    icon: "/assets/images/common/calender.svg",
  },
  {
    modulename: "Notifications",
    path: "notifications",
    group: "learning",
    icon: "/assets/images/common/notification.svg",
  },
];

// recruiter (industry recruiter). One college per session, so there is no Colleges item: a recruiter picks a
// college on the global domain's chooser and the session then belongs to that college alone.
export const recruiterNavigationMenu = () => [
  { modulename: "Today", path: "home", group: "learning", icon: "DashboardOutlined" },
  { modulename: "Drives", path: "drives", group: "learning", icon: "SolutionOutlined" },
  { modulename: "Calendar", path: "calendar", group: "learning", icon: "CalendarOutlined" },
  { modulename: "Messages", path: "messages", group: "learning", icon: "MessageOutlined" },
  { modulename: "Company & Team", path: "company", group: "account", icon: "TeamOutlined" },
];

// TPO (Training & Placement Officer). These role menus use Ant icons rather than legacy SVG
// assets: the legacy set mixes 8x6, 16x17, 20x20 and 64x58 viewboxes, and Requests used a
// white-only 8x6 checkmark that disappears on the white sidebar. Ant icons share one geometry,
// inherit currentColor, and therefore align and highlight consistently.
export const tpoNavigationMenu = () => [
  { modulename: "Home", path: "home", group: "operate", icon: "DashboardOutlined" },
  { modulename: "Placement eligibility", path: "batches", group: "operate", icon: "ApartmentOutlined" },
  { modulename: "Engage", path: "recruiters", group: "operate", icon: "UsergroupAddOutlined" },
  { modulename: "Drives", path: "drives", group: "operate", icon: "SolutionOutlined" },
  // Messages (recruiters + the placement team in two tabs; owner, 19 Oct 2026): daily use, so it sits with the work.
  { modulename: "Messages", path: "messages", group: "operate", icon: "MessageOutlined" },
  { modulename: "Students", path: "students", group: "coordinate", icon: "TeamOutlined" },
  { modulename: "Requests", path: "requests", group: "coordinate", icon: "CheckCircleOutlined" },
  { modulename: "Verification", path: "verification", group: "coordinate", icon: "SafetyCertificateOutlined" },
  { modulename: "Calendar", path: "calendar", group: "coordinate", icon: "CalendarOutlined" },
  { modulename: "Announcements", path: "announcements", group: "coordinate", icon: "NotificationOutlined" },
  { modulename: "Reports", path: "reports", group: "insights", icon: "FileTextOutlined" },
  { modulename: "Settings", path: "settings", group: "administration", icon: "BuildOutlined" },
  { modulename: "Audit log", path: "audit", group: "administration", icon: "HistoryOutlined" },
  { modulename: "Notifications", path: "notifications", group: "administration", icon: "BellOutlined" },
];

// Visible section labels for tpoNavigationMenu's group keys (SHELL-05) - Sidebar renders a text
// header, not just a divider, for any group key found here; every other role's "learning"/
// "account" groups are absent on purpose so their look is unchanged.
export const TPO_GROUP_LABELS = {
  operate: "Operate",
  coordinate: "Coordinate",
  insights: "Insights",
  administration: "Administration",
};

export const placementsTabList = [
  // Student redesign (14 Oct 2026): 8 tabs became 7, each with one job. Assessments, Interviews and Career Calendar read an older
  // source and disagreed with each other; Schedule is all three on the placement cell's own rounds. Offers left Placement cell.
  { key: "1", label: "Home", path: "" },
  { key: "2", label: "Drives", path: "jobs" },
  { key: "3", label: "Applications", path: "applications" },
  { key: "4", label: "Schedule", path: "schedule" },
  { key: "5", label: "Offers", path: "offers" },
  { key: "6", label: "Notices", path: "announcements" },
  { key: "7", label: "Placement cell", path: "placement" },
];

export const contactsTabList = [
  {
    key: "1",
    label: "All Contacts",
    path: "allContacts",
  },
  {
    key: "2",
    label: "Teachers",
    path: "teachers",
  },
  {
    key: "3",
    label: "Students",
    path: "students",
  },
];

export const monthNames = [
  0,
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const announcementTypesOption = [
  { label: "All", value: "all" },
  { label: "College", value: "collegeId" },
  { label: "Department", value: "deptId" },
  { label: "Faculty", value: "facultyId" },
];
