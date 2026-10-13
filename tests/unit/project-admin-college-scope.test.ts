import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";

const COLLEGE_A = "11111111-1111-4111-8111-111111111111";
const COLLEGE_B = "22222222-2222-4222-8222-222222222222";
const ORGANIZATION = "33333333-3333-4333-8333-333333333333";
const USER_ID = "44444444-4444-4444-8444-444444444444";
const MEMBERSHIP_ID = "55555555-5555-4555-8555-555555555555";

function context(
  overrides: Partial<RequestContext> = {},
): RequestContext {
  return {
    user: {
      id: USER_ID,
      identityUid: "synthetic-admin",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: MEMBERSHIP_ID,
      collegeId: COLLEGE_A,
      organizationId: ORGANIZATION,
      status: "ACTIVE",
      roles: ["COLLEGE_ADMIN"],
    },
    ...overrides,
  };
}

const superAdminUser = {
  id: USER_ID,
  identityUid: "synthetic-super-admin",
  platformStatus: "ACTIVE" as const,
  systemRoles: ["SUPER_ADMIN" as const],
};

describe("College Admin Projects scope resolution", () => {
  it("uses an active College Admin membership", () => {
    expect(getProjectAdminCollegeId(context())).toBe(COLLEGE_A);
  });

  it("rejects non-admin college members", () => {
    const learner = context({
      membership: {
        id: MEMBERSHIP_ID,
        collegeId: COLLEGE_A,
        organizationId: ORGANIZATION,
        status: "ACTIVE",
        roles: ["LEARNER"],
      },
    });
    expect(getProjectAdminCollegeId(learner)).toBeNull();
  });

  it("rejects inactive memberships", () => {
    const inactive = context({
      membership: {
        id: MEMBERSHIP_ID,
        collegeId: COLLEGE_A,
        organizationId: ORGANIZATION,
        status: "DISABLED",
        roles: ["COLLEGE_ADMIN"],
      },
    } as unknown as Partial<RequestContext>);
    expect(getProjectAdminCollegeId(inactive)).toBeNull();
  });

  it("rejects inactive platform accounts", () => {
    const inactive = context({
      user: {
        id: USER_ID,
        identityUid: "synthetic-disabled-admin",
        platformStatus: "DISABLED",
        systemRoles: [],
      },
    });
    expect(getProjectAdminCollegeId(inactive)).toBeNull();
  });

  it("supports a Super Admin acting inside a selected college without membership", () => {
    const superAdmin = context({
      user: superAdminUser,
      membership: null,
      adminScope: { organizationId: ORGANIZATION, collegeId: COLLEGE_B },
    });
    expect(getProjectAdminCollegeId(superAdmin)).toBe(COLLEGE_B);
  });

  it("prioritizes the selected Super Admin scope over an unrelated membership", () => {
    const superAdmin = context({
      user: superAdminUser,
      adminScope: { organizationId: ORGANIZATION, collegeId: COLLEGE_B },
    });
    expect(getProjectAdminCollegeId(superAdmin)).toBe(COLLEGE_B);
  });

  it("does not infer a college for an unscoped Super Admin", () => {
    const superAdmin = context({
      user: superAdminUser,
      membership: null,
      adminScope: null,
    });
    expect(getProjectAdminCollegeId(superAdmin)).toBeNull();
  });

  it("does not treat an organization-only Super Admin scope as a college", () => {
    const superAdmin = context({
      user: superAdminUser,
      membership: null,
      adminScope: { organizationId: ORGANIZATION, collegeId: null },
    });
    expect(getProjectAdminCollegeId(superAdmin)).toBeNull();
  });
});
