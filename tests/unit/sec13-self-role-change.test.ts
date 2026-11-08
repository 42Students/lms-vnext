import { describe, expect, it } from "vitest";
import { assertMutableMembershipTarget } from "@/modules/people/membership-protection";
import type { RequestContext } from "@/modules/identity/context";

const ctx = (userId: string, superAdmin = false) =>
  ({ user: { id: userId }, activeRole: superAdmin ? "SUPER_ADMIN" : "COLLEGE_ADMIN", roles: superAdmin ? ["SUPER_ADMIN"] : ["COLLEGE_ADMIN"] }) as unknown as RequestContext;

describe("SEC-13-009 no self role change", () => {
  it("refuses adding or removing a role on your own membership, even for a different role", () => {
    for (const action of ["ROLE_ADD", "ROLE_REMOVE"] as const)
      expect(() => assertMutableMembershipTarget(ctx("u1"), { userId: "u1", roles: ["FACULTY"] }, action, "FACULTY")).toThrow("MEMBERSHIP_SELF_ROLE_CHANGE");
  });
  it("applies to a Super Admin acting on their own membership", () => {
    expect(() => assertMutableMembershipTarget(ctx("sa", true), { userId: "sa", roles: ["FACULTY"] }, "ROLE_ADD", "COLLEGE_ADMIN")).toThrow("MEMBERSHIP_SELF_ROLE_CHANGE");
  });
  it("leaves other people's memberships to the existing rules", () => {
    expect(() => assertMutableMembershipTarget(ctx("sa", true), { userId: "other", roles: ["FACULTY"] }, "ROLE_ADD", "TPO")).not.toThrow();
  });
});
