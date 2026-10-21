/**
 * The one place that knows which account roles exist and where each one lives.
 *
 * Used by the edge guard (src/proxy.js), the session layout, the login/handoff redirects, the
 * sidebar and the mobile navigation. It is plain JS with no React/Next imports so the edge runtime
 * can load it. Design: 42Students/lms docs/recruiter-tpo/DESIGN.md.
 *
 * Adding a role: add it to ROLE and ROLE_CONFIG (portal, home, label), teach resolveRole how to
 * recognise it, and give it a menu in src/common/lists.js. A role with `strictPortal: true` is
 * confined to its own portal by the edge guard and the layout automatically, and every other role
 * is kept out of it; no other routing file needs a new branch.
 */

export const ROLE = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  TPO: "TPO",
  MENTOR: "MENTOR",
  FACULTY: "FACULTY",
  LEARNER: "LEARNER",
  RECRUITER: "RECRUITER",
});

export const ROLE_CONFIG = Object.freeze({
  [ROLE.SUPER_ADMIN]: { portal: "/superadmin", home: "/superadmin/dashboard", label: "Super Admin", strictPortal: false },
  [ROLE.ADMIN]: { portal: "/college-admin", home: "/college-admin/dashboard", label: "College Admin", strictPortal: false },
  [ROLE.TPO]: { portal: "/tpo", home: "/tpo/home", label: "TPO", strictPortal: true },
  [ROLE.MENTOR]: { portal: "/mentor", home: "/mentor/projects", label: "Mentor", strictPortal: false },
  [ROLE.FACULTY]: { portal: "/teacher", home: "/teacher/courses", label: "Faculty", strictPortal: false },
  [ROLE.LEARNER]: { portal: "/learn", home: "/learn/courses", label: "Learner", strictPortal: false },
  [ROLE.RECRUITER]: { portal: "/recruiter", home: "/recruiter/home", label: "Recruiter", strictPortal: true },
});

/**
 * Roles that may enter a strict portal without living in it. The college admin acts as TPO admin where a college has no TPO account,
 * and faculty the placement cell added as TPO admins work inside /tpo. The backend decides who is on the team.
 */
export const PORTAL_GUESTS = Object.freeze({
  "/tpo": [ROLE.ADMIN, ROLE.FACULTY],
});

/** Portals of roles that are fenced into their own portal (and that nobody else may enter). */
export const STRICT_PORTALS = Object.freeze(
  Object.values(ROLE_CONFIG).filter((c) => c.strictPortal).map((c) => c.portal)
);

const upper = (value) => (typeof value === "string" ? value.trim().toUpperCase() : "");

/** A recruiter's user type (docs/naming/RECRUITER-NAMING-PLAN-2026-10-05.md in the backend). */
export const isRecruiterType = (userType) => upper(userType) === "RECRUITER";

/**
 * Role from the identity fields shared by JWT claims and the stored user object.
 * Returns null for anything unrecognised: callers treat that as logged out, never as a learner.
 */
export function resolveRole({ userType, facultyType, id } = {}) {
  const type = upper(userType);
  if (isRecruiterType(type)) return ROLE.RECRUITER;
  if (type === "LEARNER") return ROLE.LEARNER;
  if (type === "FACULTY") {
    if (id != null && String(id) === "0") return ROLE.SUPER_ADMIN;
    const ft = upper(facultyType);
    if (ft === "ADMIN") return ROLE.ADMIN;
    if (ft === "TPO") return ROLE.TPO;
    if (ft === "MENTOR") return ROLE.MENTOR;
    return ROLE.FACULTY;
  }
  return null;
}

export const resolveRoleFromClaims = (claims) =>
  resolveRole({ userType: claims?.userType, facultyType: claims?.facultyType, id: claims?.sub });

export const resolveRoleFromUser = (user) =>
  resolveRole({ userType: user?.userType, facultyType: user?.facultyType, id: user?.id });

export const homePathForRole = (role) => ROLE_CONFIG[role]?.home || "/login";

export const portalForRole = (role) => ROLE_CONFIG[role]?.portal || null;

export const isStrictPortalRole = (role) => Boolean(ROLE_CONFIG[role]?.strictPortal);

/** Segment-aware prefix match: "/recruiter" matches "/recruiter" and "/recruiter/home", never "/recruiterx". */
export function isInPortal(pathname, portal) {
  if (typeof pathname !== "string" || !portal) return false;
  return pathname === portal || pathname.startsWith(`${portal}/`);
}

/**
 * Where a signed-in role must be sent for this path, or null to let the existing guards decide.
 * - A strict-portal role (recruiter, TPO) outside its own portal goes to its home.
 * - Any other role inside a strict portal goes to its own home.
 * Paths that are not app pages (login, handoff, public pages) are never redirected here.
 */
export function strictPortalRedirect(role, pathname) {
  if (!role || typeof pathname !== "string") return null;
  if (!isAppPath(pathname)) return null;
  const own = ROLE_CONFIG[role];
  if (!own) return null;
  if (own.strictPortal) {
    return isInPortal(pathname, own.portal) ? null : own.home;
  }
  const strict = STRICT_PORTALS.find((portal) => isInPortal(pathname, portal));
  if (strict) {
    const guests = PORTAL_GUESTS[strict] || [];
    if (guests.includes(role)) return null;
    return own.home;
  }
  return null;
}

/** Every signed-in app area (portals plus the shared signed-in pages). */
const APP_PREFIXES = [
  ...Object.values(ROLE_CONFIG).map((c) => c.portal),
  "/profile",
  "/ai-grading",
];

export function isAppPath(pathname) {
  return APP_PREFIXES.some((prefix) => isInPortal(pathname, prefix));
}

/** Protected prefixes for the edge guard: every portal plus the shared signed-in pages. */
export const PROTECTED_APP_PREFIXES = Object.freeze([...APP_PREFIXES]);

// ---------------------------------------------------------------------------------------------
// recruiter request fence (frontend mirror of the backend RecruiterFenceFilter)
// ---------------------------------------------------------------------------------------------

const RECRUITER_ALLOWED_EXACT = new Set([
  "/api/v1/recruiter",
  "/api/v1/auth/refresh",
  "/api/v1/auth/refresh-cookie",
  "/api/v1/auth/logout",
  "/api/v1/auth/logout-cookie",
  "/api/v1/auth/handoff/consume",
  "/api/v1/auth/memberships",
  "/api/v1/auth/switch",
  "/api/v1/auth/switch-token",
  "/api/v1/auth/sessions",
  "/api/v1/client-errors/report",
]);
const RECRUITER_ALLOWED_PREFIXES = ["/api/v1/recruiter/", "/api/v1/public/", "/api/v1/auth/sessions/"];

/**
 * Whether a recruiter session may send this API request. Anything else would be refused by the backend
 * fence with 403; the HTTP client cancels it quietly instead so shared page chrome written for
 * other roles never shows recruiter a permission error. Accepts a relative ("api/v1/...") or absolute URL.
 */
export function isApiAllowedForRecruiter(url) {
  if (typeof url !== "string" || !url) return false;
  let path = url;
  const schemeIdx = path.indexOf("://");
  if (schemeIdx >= 0) {
    const slash = path.indexOf("/", schemeIdx + 3);
    path = slash >= 0 ? path.slice(slash) : "/";
  }
  path = path.split("?")[0].split("#")[0];
  const apiIdx = path.indexOf("/api/");
  if (apiIdx > 0) path = path.slice(apiIdx);
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.includes("..") || path.includes("//")) return false;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (RECRUITER_ALLOWED_EXACT.has(path)) return true;
  return RECRUITER_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}
