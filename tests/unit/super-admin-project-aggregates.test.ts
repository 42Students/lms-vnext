import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";

const ORGANIZATION_ID = "33333333-3333-4333-8333-333333333333";
const COLLEGE_A = "11111111-1111-4111-8111-111111111111";
const COLLEGE_B = "22222222-2222-4222-8222-222222222222";
const USER_ID = "44444444-4444-4444-8444-444444444444";
const MEMBERSHIP_ID = "55555555-5555-4555-8555-555555555555";

function superAdminContext(collegeId: string | null): RequestContext {
  return {
    user: {
      id: USER_ID,
      identityUid: "synthetic-super-admin",
      platformStatus: "ACTIVE",
      systemRoles: ["SUPER_ADMIN"],
    },
    membership: null,
    adminScope: collegeId
      ? { organizationId: ORGANIZATION_ID, collegeId }
      : null,
  };
}

describe("Super Admin project aggregate scope", () => {
  it("does not infer a college from a platform-wide Super Admin context", () => {
    expect(getProjectAdminCollegeId(superAdminContext(null))).toBeNull();
  });

  it("uses the explicitly selected Super Admin college", () => {
    expect(getProjectAdminCollegeId(superAdminContext(COLLEGE_B))).toBe(
      COLLEGE_B,
    );
  });

  it("does not fall back to membership for a Super Admin", () => {
    const context = superAdminContext(null);

    context.membership = {
      id: MEMBERSHIP_ID,
      collegeId: COLLEGE_A,
      organizationId: ORGANIZATION_ID,
      status: "ACTIVE",
      roles: ["COLLEGE_ADMIN"],
    };

    expect(getProjectAdminCollegeId(context)).toBeNull();
  });
});
