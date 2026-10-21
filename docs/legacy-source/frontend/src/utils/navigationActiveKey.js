import { ADMIN_PATH_TO_GROUP, groupDefaultPath } from "@/common/adminNavGroups";
import { SUPER_ADMIN_PATH_TO_GROUP, superAdminGroupDefaultPath } from "@/common/superAdminNavGroups";

const ROLE_ROOT_SEGMENTS = new Set(["learn", "teacher", "mentor", "college-admin", "superadmin", "recruiter", "tpo"]);

const PLACEMENT_ROUTE_SEGMENTS = new Set([
  "my-placements",
  "jobs",
  "applications",
  "my-applications",
  "assessments",
  "interviews",
  "career-calendar",
  "saved-jobs",
]);

const stripUrlDecorators = (pathname = "") =>
  String(pathname).split("?")[0].split("#")[0];

export const getSidebarActiveKey = (pathname = "") => {
  const segments = stripUrlDecorators(pathname).split("/").filter(Boolean);
  if (!segments.length) return "courses";

  const [rootSegment, moduleSegment] = segments;

  if (rootSegment === "college-admin") {
    if (!moduleSegment || moduleSegment.startsWith("[")) return "dashboard";
    // Every page inside one of the collapsed admin groups (Academic Setup, Courses & Content,
    // People, Placements, Projects, Communication — see adminNavGroups.js) highlights that
    // group's sidebar row, keyed by the group's own default/landing page path.
    const groupKey = ADMIN_PATH_TO_GROUP[moduleSegment];
    if (groupKey) return groupDefaultPath(groupKey);
    return moduleSegment;
  }

  if (rootSegment === "superadmin") {
    if (!moduleSegment || moduleSegment.startsWith("[")) return "dashboard";
    const groupKey = SUPER_ADMIN_PATH_TO_GROUP[moduleSegment];
    if (groupKey) return superAdminGroupDefaultPath(groupKey);
    return moduleSegment;
  }

  // recruiter and TPO portals (src/config/roles.js) land on "home".
  if (rootSegment === "recruiter" || rootSegment === "tpo") {
    if (!moduleSegment || moduleSegment.startsWith("[")) return "home";
    // Employer 360 is a detail surface inside the RecruiterLeads/CRM workspace, not a separate
    // sidebar destination. Keep RecruiterLeads highlighted while /tpo/companies is open.
    if (rootSegment === "tpo" && moduleSegment === "companies") return "recruiters";
    return moduleSegment;
  }

  if (rootSegment === "learn" || rootSegment === "teacher" || rootSegment === "mentor") {
    if (!moduleSegment || moduleSegment.startsWith("[")) return "courses";
    if (rootSegment === "learn" && PLACEMENT_ROUTE_SEGMENTS.has(moduleSegment)) {
      return "my-placements";
    }
    return moduleSegment;
  }

  const routeSegment = segments.find(
    segment => !ROLE_ROOT_SEGMENTS.has(segment) && !segment.startsWith("[")
  );

  return routeSegment || "courses";
};
