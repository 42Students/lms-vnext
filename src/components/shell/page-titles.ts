/**
 * Browser tab titles, copied from the legacy LMS (dev branch):
 * `src/common/constant.js` routeTitles / adminRouteTitles and
 * `src/utils/pageTitle.js` (format `<title> · 42LMS`, fallback `42LMS`).
 */
export const BROWSER_TITLE_DEFAULT = "42LMS";
export const BROWSER_TITLE_SUFFIX = " · 42LMS";
/** SuperAdminLayout sets one constant title for every Super Admin page. */
export const SUPER_ADMIN_BROWSER_TITLE = "Superadmin · 42LMS";

const ROUTE_TITLES: Record<string, string> = {
  courses: "Courses",
  mentor: "Mentor",
  contacts: "Contacts",
  notifications: "Notifications",
  calendar: "Calendar",
  allQuizzes: "All Quizzes",
  allAssignments: "All Assignment",
  attendance: "Attendance",
  "my-placements": "My Placements",
  profile: "Profile",
  projects: "Projects",
};

const ADMIN_ROUTE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  activity: "Activity Log",
  departments: "Departments",
  courses: "Courses",
  lessons: "Lessons",
  quizzes: "Quizzes",
  programs: "Programs",
  semesters: "Semesters",
  "semester-courses": "Semester-Course Mapping",
  batches: "Batches",
  classes: "Classes",
  "batch-promotion": "Batch Promotion",
  "lecture-halls": "Lecture Halls",
  electives: "Electives",
  faculty: "Faculty",
  "faculty-assignment": "Faculty Assignment",
  students: "Students",
  people: "People Directory",
  verification: "Profile verification",
  placements: "Placements",
  videos: "Video",
  resources: "Resources",
  "live-classes": "Live Classes",
  assignments: "Assignments",
  "course-progress": "Progress",
  attendance: "Attendance",
  projects: "Projects",
  profile: "Profile",
};

/** User/tenant IDs and opaque route tokens must never become tab titles. */
function safeRouteTitle(segment:string):string|null{
 if(!/^[a-z][a-z0-9_-]{0,39}$/i.test(segment))return null;
 if(/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment))return null;
 if(/(?:^|[-_])[0-9a-f]{16,}(?:$|[-_])/i.test(segment))return null;
 return titleCase(segment);
}

function titleCase(segment: string) {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Page title (without the ` · 42LMS` suffix) for a pathname, or null. */
export function pageTitleForPath(
  pathname: string,
  options: { superAdmin?: boolean } = {},
): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  if (options.superAdmin) return "Superadmin";

  const [area, second] = segments;
  if (area === "dashboard") return "Dashboard";
  if (area === "notifications") return "Notifications";
  if (area === "activity") return "Activity Log";

  if (area === "college") {
    if (!second) return "Dashboard";
    return ADMIN_ROUTE_TITLES[second] ?? safeRouteTitle(second);
  }

  if (area === "learn" || area === "teacher") {
    if (!second) return area === "learn" ? "Courses" : null;
    return ROUTE_TITLES[second] ?? safeRouteTitle(second);
  }

  if (area === "mentor") {
    if (!second) return ROUTE_TITLES.mentor;
    if (second === "projects") return ROUTE_TITLES.mentor;
    return ROUTE_TITLES[second] ?? safeRouteTitle(second);
  }

  if (area === "tpo" || area === "hr" || area === "recruiter") {
    if (!second) return area === "tpo" ? "Placements" : "Recruiter";
    return ROUTE_TITLES[second] ?? ADMIN_ROUTE_TITLES[second] ?? safeRouteTitle(second);
  }

  return null;
}

/** Full document title; falls back to the bare `42LMS`. */
export function browserTitleForPath(
  pathname: string,
  options: { superAdmin?: boolean } = {},
): string {
  if (options.superAdmin && pathname.split("/").filter(Boolean).length > 0) {
    return SUPER_ADMIN_BROWSER_TITLE;
  }
  const title = pageTitleForPath(pathname, options);
  return title ? `${title}${BROWSER_TITLE_SUFFIX}` : BROWSER_TITLE_DEFAULT;
}
