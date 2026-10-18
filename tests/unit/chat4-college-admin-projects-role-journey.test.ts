import { describe, expect, it } from "vitest";
import {
  collegeAcademicSetupStep,
  collegeLegacyGroupForPath,
  collegeLegacyNavigationPath,
} from "@/modules/people/college-legacy-tabs-model";
import { COLLEGE_ADMIN_SETUP_PHASES } from "@/modules/admin-ui/admin-dashboard-navigation";
import {
  isProjectMentorOverloaded,
  projectMentorWorkloadAverage,
} from "@/modules/projects/mentor-overload-model";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import { parseCollegeProjectsQuery } from "@/modules/projects/college-projects-query-model";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import type { RequestContext } from "@/modules/identity/context";

const college = "40000000-0000-4000-8000-000000000001";
const foreignCollege = "40000000-0000-4000-8000-000000000002";
const organization = "50000000-0000-4000-8000-000000000001";
const foreignOrganization = "50000000-0000-4000-8000-000000000002";

const collegeAdmin = (): RequestContext => ({
  user: { id: "admin-user", identityUid: "admin-identity", platformStatus: "ACTIVE", systemRoles: [] },
  membership: {
    id: "admin-membership", collegeId: college, organizationId: organization,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
});
const target = (collegeId = college, organizationId = organization) => ({ collegeId, organizationId });

describe("PROJ-BREAK-COLLEGE-04 College Admin project authorization journey", () => {
  it("PROJ-BREAK-COLLEGE-04-01 grants read/manage only for an active College Admin in the matching college", () => {
    const context = collegeAdmin();
    expect(can(context, "projects.read", target())).toBe(true);
    expect(can(context, "projects.manage", target())).toBe(true);
    expect(() => requirePermission(context, "projects.manage", target())).not.toThrow();
  });

  it("PROJ-BREAK-COLLEGE-04-02 rejects a guessed project college ID and an organization mismatch", () => {
    const context = collegeAdmin();
    for (const resource of [
      target(foreignCollege, foreignOrganization),
      target(foreignCollege, organization),
      target(college, foreignOrganization),
    ]) {
      expect(can(context, "projects.read", resource)).toBe(false);
      expect(can(context, "projects.manage", resource)).toBe(false);
      expect(() => requirePermission(context, "projects.manage", resource)).toThrow(AuthorizationError);
    }
  });

  it("PROJ-BREAK-COLLEGE-04-03 rejects a Faculty, Mentor, Learner or TPO session from administrator mutations", () => {
    for (const role of ["FACULTY", "MENTOR", "LEARNER", "TPO"] as const) {
      const admin = collegeAdmin();
      const context: RequestContext = {
        ...admin, membership: { ...admin.membership!, roles: [role] },
      };
      expect(can(context, "projects.manage", target())).toBe(false);
    }
  });

  it("PROJ-BREAK-COLLEGE-04-04 rejects disabled users, ended and removed memberships before project writes", () => {
    const admin = collegeAdmin();
    const inactiveUser: RequestContext = {
      ...admin, user: { ...admin.user, platformStatus: "DISABLED" },
    };
    const endedMembership: RequestContext = {
      ...admin, membership: { ...admin.membership!, status: "ENDED" },
    };
    const removedMembership: RequestContext = { ...admin, membership: null };
    for (const context of [inactiveUser, endedMembership, removedMembership]) {
      expect(can(context, "projects.manage", target())).toBe(false);
      expect(() => requirePermission(context, "projects.manage", target())).toThrow(AuthorizationError);
    }
  });

  it("PROJ-BREAK-COLLEGE-04-05 isolates an organization-scoped Super Admin from other organizations", () => {
    const admin = collegeAdmin();
    const scoped: RequestContext = {
      ...admin,
      user: { ...admin.user, systemRoles: ["SUPER_ADMIN"] },
      membership: null,
      adminScope: { organizationId: organization, collegeId: null },
    };
    expect(can(scoped, "projects.manage", target())).toBe(true);
    expect(can(scoped, "projects.manage", target(foreignCollege, foreignOrganization))).toBe(false);
    expect(can(scoped, "projects.manage", target(college, foreignOrganization))).toBe(false);
  });

  it("PROJ-BREAK-COLLEGE-04-06 enforces the selected Super Admin college even within an organization", () => {
    const admin = collegeAdmin();
    const scoped: RequestContext = {
      ...admin,
      user: { ...admin.user, systemRoles: ["SUPER_ADMIN"] },
      membership: null,
      adminScope: { organizationId: organization, collegeId: college },
    };
    expect(can(scoped, "projects.manage", target())).toBe(true);
    expect(can(scoped, "projects.manage", target(foreignCollege, organization))).toBe(false);
    expect(can(scoped, "projects.manage", target(college, foreignOrganization))).toBe(false);
  });
});

describe("Existing chat-4 CI failure regression contracts", () => {
  it("COL-academic-setup-R03 keeps periods discoverable without creating a seventh legacy setup tab", () => {
    const phases = COLLEGE_ADMIN_SETUP_PHASES.find(phase => phase.title === "Academic Structure");
    expect(phases).toBeDefined();
    const steps = phases!.steps.map(step => step.key);
    expect(steps.indexOf("academic-periods")).toBeGreaterThan(steps.indexOf("semester-courses"));
    expect(steps.indexOf("academic-periods")).toBeLessThan(steps.indexOf("batches"));
    expect(collegeLegacyNavigationPath("/college/academics")).toBe("/college/departments");
    expect(collegeLegacyNavigationPath("/college/academics/sections")).toBe("/college/departments");
    expect(collegeLegacyGroupForPath("/college/academics")?.title).toBe("Academic Setup");
    expect(collegeAcademicSetupStep("/college/departments")).toMatchObject({ index: 1, total: 6 });
    expect(collegeAcademicSetupStep("/college/classes")).toMatchObject({ index: 6, total: 6 });
    expect(collegeAcademicSetupStep("/college/academics")).toBeNull();
  });

  it("SA-placements-projects-58 overload is strictly above 150% of the current average, not a fixed cap", () => {
    expect(projectMentorWorkloadAverage([])).toBe(0);
    expect(projectMentorWorkloadAverage([2, 4, 8])).toBeCloseTo(14 / 3);
    expect(isProjectMentorOverloaded(8, [2, 4, 8])).toBe(true);
    expect(isProjectMentorOverloaded(7, [2, 4, 8])).toBe(false);
    expect(isProjectMentorOverloaded(8, [8, 8, 8])).toBe(false);
    expect(isProjectMentorOverloaded(151, [100, 100])).toBe(true);
    expect(isProjectMentorOverloaded(150, [100, 100])).toBe(false);
    expect(isProjectMentorOverloaded(1, [])).toBe(false);
  });
});

describe("PROJ-BREAK-COLLEGE-04 College Admin project list URL and navigation hardening", () => {
  it("PROJ-BREAK-COLLEGE-04-07 resolves college navigation from the active membership, never a request-supplied identifier", () => {
    expect(getProjectAdminCollegeId(collegeAdmin())).toBe(college);
    const admin = collegeAdmin();
    const wrongRole: RequestContext = {
      ...admin, membership: { ...admin.membership!, roles: ["TPO"] },
    };
    const disabled: RequestContext = {
      ...admin, user: { ...admin.user, platformStatus: "DISABLED" },
    };
    expect(getProjectAdminCollegeId(wrongRole)).toBeNull();
    expect(getProjectAdminCollegeId(disabled)).toBeNull();
    expect(getProjectAdminCollegeId({ ...admin, membership: null })).toBeNull();
  });

  it("PROJ-BREAK-COLLEGE-04-08 requires an explicitly selected college before a Super Admin navigates college projects", () => {
    const admin = collegeAdmin();
    const base: RequestContext = {
      ...admin, user: { ...admin.user, systemRoles: ["SUPER_ADMIN"] },
      membership: null,
    };
    expect(getProjectAdminCollegeId(base)).toBeNull();
    expect(getProjectAdminCollegeId({
      ...base, adminScope: { collegeId: null, organizationId: organization },
    })).toBeNull();
    expect(getProjectAdminCollegeId({
      ...base, adminScope: { collegeId: college, organizationId: organization },
    })).toBe(college);
  });

  it("PROJ-BREAK-COLLEGE-04-09 preserves numeric pagination and valid college project status filters", () => {
    const result = parseCollegeProjectsQuery({
      q: "  semester workspace ", status: "ACTIVE", view: "table", page: "2", pageSize: "50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        q: "semester workspace", status: "ACTIVE", view: "table", page: 2, pageSize: 50,
      });
    }
    const defaults = parseCollegeProjectsQuery({});
    expect(defaults.success).toBe(true);
    if (defaults.success) expect(defaults.data).toMatchObject({ view: "cards", page: 1, pageSize: 25 });
  });

  it("PROJ-BREAK-COLLEGE-04-10 refuses duplicated, foreign, malformed or exponential query filters", () => {
    for (const params of [
      { q: ["one", "two"] },
      { page: ["1", "1000"] },
      { view: ["cards", "table"] },
      { status: ["ACTIVE", "ARCHIVED"] },
      { pageSize: ["25", "100"] },
      { collegeId: foreignCollege },
      { action: "" },
      { page: "0" },
      { page: "-1" },
      { page: "1.5" },
      { page: "1e2" },
      { page: "0x10" },
      { pageSize: "Infinity" },
      { pageSize: "101" },
      { status: "DRAFT" },
      { q: "a".repeat(121) },
    ]) {
      expect(parseCollegeProjectsQuery(params).success).toBe(false);
    }
  });
});
