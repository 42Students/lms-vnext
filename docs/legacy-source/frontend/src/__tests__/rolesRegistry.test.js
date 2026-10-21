import {
  ROLE,
  homePathForRole,
  isApiAllowedForRecruiter,
  isInPortal,
  resolveRoleFromClaims,
  resolveRoleFromUser,
  strictPortalRedirect,
  PROTECTED_APP_PREFIXES,
} from "@/config/roles";
import { getSidebarActiveKey } from "@/utils/navigationActiveKey";
import { getUserRole, isFacultyRole, isRecruiterRole, isTpoRole, getProfilePath } from "@/utils/roleUtils";

describe("role resolution", () => {
  test.each([
    [{ userType: "FACULTY", facultyType: "ADMIN", sub: "0" }, ROLE.SUPER_ADMIN],
    [{ userType: "FACULTY", facultyType: "ADMIN", sub: "12" }, ROLE.ADMIN],
    [{ userType: "FACULTY", facultyType: "TPO", sub: "12" }, ROLE.TPO],
    [{ userType: "FACULTY", facultyType: "MENTOR", sub: "12" }, ROLE.MENTOR],
    [{ userType: "FACULTY", facultyType: "LECTURER", sub: "12" }, ROLE.FACULTY],
    [{ userType: "FACULTY", facultyType: null, sub: "12" }, ROLE.FACULTY],
    [{ userType: "LEARNER", sub: "12" }, ROLE.LEARNER],
    [{ userType: "RECRUITER", sub: "12" }, ROLE.RECRUITER],
    // recruiter id 0 is never a super admin; unknown and missing types are not guessed.
    [{ userType: "RECRUITER", sub: "0" }, ROLE.RECRUITER],
    [{ userType: "ROBOT", sub: "12" }, null],
    [{}, null],
  ])("%j -> %s", (claims, expected) => {
    expect(resolveRoleFromClaims(claims)).toBe(expected);
  });

  test("stored user objects resolve the same way", () => {
    expect(resolveRoleFromUser({ id: 0, userType: "FACULTY", facultyType: "ADMIN" })).toBe(ROLE.SUPER_ADMIN);
    expect(resolveRoleFromUser({ id: 7, userType: "RECRUITER", recruiterScope: "GLOBAL" })).toBe(ROLE.RECRUITER);
    expect(resolveRoleFromUser(null)).toBeNull();
  });
});

describe("home pages", () => {
  test("existing roles keep their landing pages", () => {
    expect(homePathForRole(ROLE.SUPER_ADMIN)).toBe("/superadmin/dashboard");
    expect(homePathForRole(ROLE.ADMIN)).toBe("/college-admin/dashboard");
    expect(homePathForRole(ROLE.MENTOR)).toBe("/mentor/projects");
    expect(homePathForRole(ROLE.FACULTY)).toBe("/teacher/courses");
    expect(homePathForRole(ROLE.LEARNER)).toBe("/learn/courses");
  });

  test("HR and TPO land in their own portals; unknown goes to login", () => {
    expect(homePathForRole(ROLE.RECRUITER)).toBe("/recruiter/home");
    expect(homePathForRole(ROLE.TPO)).toBe("/tpo/home");
    expect(homePathForRole(null)).toBe("/login");
  });

  test("every portal is protected at the edge", () => {
    for (const prefix of ["/learn", "/teacher", "/mentor", "/college-admin", "/superadmin", "/profile", "/ai-grading", "/recruiter", "/tpo"]) {
      expect(PROTECTED_APP_PREFIXES).toContain(prefix);
    }
  });
});

describe("strict portals (HR, TPO)", () => {
  test("HR and TPO are confined to their own portal", () => {
    for (const path of ["/learn/courses", "/teacher/courses", "/mentor/projects", "/college-admin/dashboard", "/superadmin/dashboard", "/profile", "/tpo/home"]) {
      expect(strictPortalRedirect(ROLE.RECRUITER, path)).toBe("/recruiter/home");
    }
    for (const path of ["/learn/courses", "/teacher/courses", "/college-admin/dashboard", "/recruiter/home"]) {
      expect(strictPortalRedirect(ROLE.TPO, path)).toBe("/tpo/home");
    }
    expect(strictPortalRedirect(ROLE.RECRUITER, "/recruiter/home")).toBeNull();
    expect(strictPortalRedirect(ROLE.RECRUITER, "/recruiter/profile")).toBeNull();
    expect(strictPortalRedirect(ROLE.TPO, "/tpo/notifications")).toBeNull();
  });

  test("everyone else is kept out of the HR and TPO portals", () => {
    expect(strictPortalRedirect(ROLE.LEARNER, "/recruiter/home")).toBe("/learn/courses");
    // /tpo is also the workspace of the college admin acting as TPO admin and of faculty added as TPO admins (the backend
    // decides who is on the team). Learners never enter it: student coordinators were removed on 9 Oct 2026.
    expect(strictPortalRedirect(ROLE.FACULTY, "/tpo/home")).toBeNull();
    expect(strictPortalRedirect(ROLE.ADMIN, "/tpo/home")).toBeNull();
    expect(strictPortalRedirect(ROLE.LEARNER, "/tpo/drive-day/12")).toBe("/learn/courses");
    expect(strictPortalRedirect(ROLE.LEARNER, "/tpo/students")).toBe("/learn/courses");
    expect(strictPortalRedirect(ROLE.MENTOR, "/tpo/home")).toBe("/mentor/projects");
    expect(strictPortalRedirect(ROLE.FACULTY, "/recruiter/home")).toBe("/teacher/courses");
    expect(strictPortalRedirect(ROLE.ADMIN, "/recruiter")).toBe("/college-admin/dashboard");
    expect(strictPortalRedirect(ROLE.SUPER_ADMIN, "/recruiter/home")).toBe("/superadmin/dashboard");
  });

  test("existing roles on their existing pages are left to the existing guards", () => {
    expect(strictPortalRedirect(ROLE.LEARNER, "/learn/courses")).toBeNull();
    expect(strictPortalRedirect(ROLE.FACULTY, "/mentor/projects")).toBeNull();
    expect(strictPortalRedirect(ROLE.SUPER_ADMIN, "/learn/courses")).toBeNull();
    expect(strictPortalRedirect(ROLE.ADMIN, "/teacher/courses")).toBeNull();
  });

  test("public and auth pages are never redirected", () => {
    for (const path of ["/", "/login", "/auth/handoff", "/home", "/superadmin-login"]) {
      expect(strictPortalRedirect(ROLE.RECRUITER, path)).toBeNull();
    }
  });

  test("portal matching is segment-aware", () => {
    expect(isInPortal("/recruiter", "/recruiter")).toBe(true);
    expect(isInPortal("/recruiter/home", "/recruiter")).toBe(true);
    expect(isInPortal("/hrx/home", "/recruiter")).toBe(false);
    expect(isInPortal(null, "/recruiter")).toBe(false);
  });
});

describe("HR API fence (mirror of backend HrFenceFilter)", () => {
  test.each([
    "/api/v1/recruiter/me",
    "api/v1/recruiter/me",
    "https://42lms.com/lms-backend/api/v1/recruiter/me?x=1",
    "/api/v1/auth/refresh",
    "/api/v1/auth/memberships",
    "/api/v1/auth/switch",
    "/api/v1/auth/sessions/abc",
    "/api/v1/public/tenant-bootstrap",
    "/api/v1/client-errors/report",
  ])("allows %s", (url) => {
    expect(isApiAllowedForRecruiter(url)).toBe(true);
  });

  test.each([
    "/api/v1/features/mine",
    "/api/v1/college/getCollegeDetails",
    "/api/v1/profile/learner/5",
    "/api/v1/notification/subscribe",
    "/api/v1/auth/revoke-sessions",
    "/api/v1/superadmin/recruiters",
    "/api/v1/recruiterx/me",
    "/api/v1/recruiter/../admin/module-access",
    "/api/v2/courses/search",
    "",
    null,
  ])("blocks %s", (url) => {
    expect(isApiAllowedForRecruiter(url)).toBe(false);
  });
});

describe("role helpers used by existing components", () => {
  test("TPO is not treated as a teacher; HR is its own role", () => {
    const tpo = { userType: "FACULTY", facultyType: "TPO" };
    const recruiter = { userType: "RECRUITER" };
    expect(getUserRole(tpo)).toBe("TPO");
    expect(getUserRole(recruiter)).toBe("RECRUITER");
    expect(isFacultyRole(tpo)).toBe(false);
    expect(isTpoRole(tpo)).toBe(true);
    expect(isRecruiterRole(recruiter)).toBe(true);
    expect(getProfilePath(tpo)).toBe("/tpo/profile");
    expect(getProfilePath(recruiter)).toBe("/recruiter/profile");
  });

  test("existing faculty roles are unchanged", () => {
    expect(getUserRole({ userType: "FACULTY", facultyType: "LECTURER" })).toBe("FACULTY");
    expect(isFacultyRole({ userType: "FACULTY", facultyType: "MENTOR" })).toBe(true);
    expect(isFacultyRole({ userType: "FACULTY", facultyType: "ADMIN" })).toBe(false);
  });

  test("sidebar highlights HR and TPO home", () => {
    expect(getSidebarActiveKey("/recruiter/home")).toBe("home");
    expect(getSidebarActiveKey("/recruiter")).toBe("home");
    expect(getSidebarActiveKey("/tpo/profile")).toBe("profile");
    // Recruiter accounts and Announcements are tabs of Placements (Announcements V2): the Placements row lights up.
    expect(getSidebarActiveKey("/superadmin/recruiters")).toBe("jobs");
    expect(getSidebarActiveKey("/superadmin/announcements")).toBe("jobs");
  });
});
