export const QUICK_REPORT_ENABLED_KEY = "42tracker_quick_report_enabled_v1";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * True if the given event target is (or is inside) something the user could plausibly be typing
 * into -- used to keep the sitewide Alt+B shortcut from hijacking focus away from a real text field.
 * Checks ancestors too since rich editors and antd's own inputs often wrap the real editable node
 * a layer or two deep (e.g. a contenteditable div inside a toolbar wrapper).
 */
export function isEditableTarget(target) {
  let node = target;
  while (node && node.nodeType === 1) {
    if (EDITABLE_TAGS.has(node.tagName)) return true;
    // Prefer isContentEditable (reflects inherited contenteditable too), but fall back to the raw
    // attribute -- some test/rendering environments (and a few edge cases in real browsers) don't
    // keep isContentEditable in sync with an attribute set after the element already exists.
    if (node.isContentEditable || node.getAttribute?.("contenteditable") === "true") return true;
    node = node.parentElement;
  }
  return false;
}

export function inferTrackerAccount(user) {
  if (!user) return "NOT_SURE";
  if (Number(user.id) === 0) return "SUPER_ADMIN";

  const userType = String(user.userType || user.user_type || "").toUpperCase();
  const facultyType = String(user.facultyType || user.faculty_type || "").toUpperCase();

  if (userType === "LEARNER" || userType === "STUDENT") return "LEARNER";
  if (userType === "FACULTY") {
    if (facultyType === "ADMIN") return "COLLEGE_ADMIN";
    if (facultyType === "MENTOR") return "MENTOR";
    return "FACULTY";
  }
  return "NOT_SURE";
}

export function inferTrackerLocation(pathname = "", asPath = "") {
  const p = String(asPath || pathname || "").toLowerCase();

  if (p.includes("/projects")) {
    if (p.includes("/templates")) {
      return ["Projects", "Templates", p.match(/\/templates\/[^/?#]+/) ? "Template Details" : "List"];
    }
    if (p.includes("/workspaces/") && p.includes("/tasks")) return ["Projects", "Project Details", "Tasks"];
    if (p.includes("/workspaces/") && p.includes("/sprints")) return ["Projects", "Project Details", "Sprints"];
    if (p.includes("/workspaces/") && p.includes("/resources")) return ["Projects", "Project Details", "Resources"];
    if (p.includes("/workspaces/") && p.includes("/meetings")) return ["Projects", "Project Details", "Meetings"];
    if (p.includes("/workspaces/") && p.includes("/audit")) return ["Projects", "Project Details", "Activity"];
    if (p.includes("/workspaces/")) return ["Projects", "Workspaces", "Workspace Details"];
    if (p.includes("/submissions")) return ["Projects", "Submissions", "Other"];
    return ["Projects", "Workspaces", "List"];
  }

  if (p.includes("/my-placements") || p.includes("/jobs") || p.includes("/hiring-dashboard") || p.includes("/companies")) {
    if (p.includes("/jobs")) {
      return ["Placements", "Jobs", /\/jobs\/[^/?#]+/.test(p) ? "Job Details" : "Jobs List"];
    }
    if (p.includes("/applications")) return ["Placements", "Applications", "Applications List"];
    if (p.includes("/interviews")) return ["Placements", "Interviews", "Interview Details"];
    if (p.includes("/hiring-dashboard")) return ["Placements", "Hiring Dashboard", "Metrics"];
    if (p.includes("/companies")) return ["Placements", "Companies", "Companies List"];
    return ["Placements", "Applications", "Other"];
  }

  if (p.includes("/lesson-content")) return ["Courses", "Lesson", "Lesson Content"];
  if (p.includes("/lessons")) return ["Courses", "Lesson", "Lesson Details"];
  if (p.includes("/courses")) {
    if (p.includes("learning-path")) return ["Courses", "Learning Path", "Other"];
    if (/\/courses\/[^/?#]+/.test(p)) return ["Courses", "Course Details", "Other"];
    return ["Courses", "List / Overview", "Other"];
  }

  if (p.includes("assignment")) return ["Assignments", "List / Overview", "Other"];
  if (p.includes("quiz") || p.includes("exam")) return ["Quizzes / Exams", "List / Overview", "Other"];
  if (p.includes("/attendance")) return ["Attendance", "Attendance View", "Other"];
  if (p.includes("/calendar")) return ["Calendar / Class Schedule", "Calendar View", "Other"];

  if (p.includes("/students")) return ["People", "Students", "List"];
  if (p.includes("/teachers")) return ["People", "Faculty / Teachers", "List"];
  if (p.includes("/people")) return ["People", "People Directory", "List"];

  const academic = [
    ["departments", "Departments"],
    ["programs", "Programs"],
    ["batches", "Batches"],
    ["classes", "Classes"],
    ["semesters", "Semesters"],
    ["semester-courses", "Semester Courses"],
    ["faculty-assignment", "Faculty Assignment"],
    ["lecture-halls", "Lecture Halls"],
  ];
  for (const [segment, label] of academic) {
    if (p.includes("/" + segment)) return ["Academic Setup", label, "List"];
  }

  if (p.includes("/notifications")) return ["Notifications", "Notifications List"];
  if (p.includes("/profile")) return ["Profile", "Profile View"];
  if (p.includes("/module-access")) return ["Settings", "Module Access", "Module List"];
  if (p.includes("/tenants")) return ["Settings", "Tenants", "Tenant List"];
  if (p.includes("/settings")) return ["Settings", "General Settings", "Other"];
  if (p.includes("/audit")) return ["Audit", "Activity Log"];
  if (p.includes("dashboard") || /\/(learn|teacher|mentor|college-admin|superadmin)\/?$/.test(p)) {
    return ["Dashboard", "Overview"];
  }
  return ["Other", "Other"];
}

export function buildTrackerSourceContext(routerPathname = "") {
  if (typeof window === "undefined") {
    return { sourceUrl: null, sourcePath: routerPathname || null, browser: null, viewport: null };
  }

  const sourceUrl = `${window.location.origin}${window.location.pathname}`;
  const ratio = Number(window.devicePixelRatio || 1);
  return {
    sourceUrl: sourceUrl.slice(0, 2000),
    sourcePath: String(routerPathname || window.location.pathname || "").slice(0, 500),
    browser: String(window.navigator?.userAgent || "").slice(0, 500) || null,
    viewport: `${window.innerWidth}x${window.innerHeight}@${ratio}`.slice(0, 64),
  };
}
