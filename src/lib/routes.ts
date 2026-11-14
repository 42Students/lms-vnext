/**
 * Typed application routes. Links, redirects and breadcrumbs build their path here instead of concatenating strings, so a
 * moved page is one edit and tests/unit/sec-routes.test.ts proves every route below is a real page in src/app.
 * Dynamic ids are encoded, so an id can never add a path segment or a query.
 */
const id = (value: string) => encodeURIComponent(value);

export const ROUTES = {
  college: {
    home: "/college",
    placements: "/college/placements",
    placementJob: (jobId: string) => `/college/placements/jobs/${id(jobId)}`,
    projects: "/college/projects",
    courses: "/college/courses",
  },
  admin: {
    projects: "/admin/projects",
    projectTemplates: "/admin/projects/templates",
    placements: "/admin/placements",
    placementDrives: "/admin/placements/drives",
    placementJob: (jobId: string) => `/admin/placements/jobs/${id(jobId)}`,
    courses: "/admin/courses",
    colleges: "/admin/colleges",
    college: (collegeId: string) => `/admin/colleges/${id(collegeId)}`,
    academics: "/admin/academics",
  },
  tpo: {
    placements: "/tpo/placements",
    placementJob: (jobId: string) => `/tpo/placements/jobs/${id(jobId)}`,
    batches: "/tpo/batches",
    batch: (batchId: string) => `/tpo/batches/${id(batchId)}`,
    reports: "/tpo/reports",
    students: "/tpo/students",
    recruiters: "/tpo/recruiters",
    companies: "/tpo/companies",
    company: (companyId: string) => `/tpo/companies/${id(companyId)}`,
    messages: "/tpo/messages",
    requests: "/tpo/requests",
    calendar: "/tpo/calendar",
  },
  learn: {
    courses: "/learn/courses",
    myPlacements: "/learn/my-placements",
    applications: "/learn/my-placements/applications",
    placementJobs: "/learn/my-placements/jobs",
    offers: "/learn/my-placements/offers",
    profile: "/learn/profile",
  },
  teacher: {
    courses: "/teacher/courses",
  },
  mentor: {
    projects: "/mentor/projects",
  },
  hr: {
    home: "/hr/home",
    drives: "/hr/drives",
  },
} as const;

/** Every fixed (non-function) route, flattened, for tests and tooling. */
export function fixedRoutes(): string[] {
  const out: string[] = [];
  for (const group of Object.values(ROUTES)) {
    for (const value of Object.values(group)) if (typeof value === "string") out.push(value);
  }
  return out;
}
