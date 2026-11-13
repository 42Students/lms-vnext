import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { retainSelectedMembershipRole } from "@/modules/permissions/persisted-actor";
import { can } from "@/modules/permissions/policy";
import type { ActiveMembership, RequestContext } from "@/modules/identity/context";

describe("persisted actor: one active role, not all stored roles", () => {
  const resource = { collegeId: "college-a", organizationId: "org-a" };
  const contextFor = (roles: ActiveMembership["roles"]): RequestContext => ({
    user: {
      id: "user-a",
      identityUid: "identity-a",
      platformStatus: "ACTIVE",
      systemRoles: [],
    },
    membership: {
      id: "membership-a",
      collegeId: resource.collegeId,
      organizationId: resource.organizationId,
      status: "ACTIVE",
      roles,
    },
    adminScope: null,
    recruiter: null,
  });

  it("never restores College Admin privileges in the selected Learner workspace", () => {
    const selected = retainSelectedMembershipRole(
      ["LEARNER"], ["COLLEGE_ADMIN", "LEARNER"],
    );
    expect(selected).toEqual(["LEARNER"]);
    expect(can(contextFor(selected), "people.manage", resource)).toBe(false);
    expect(can(contextFor(selected), "courses.read", resource)).toBe(true);
  });

  it("keeps the selected admin role when it is still persisted", () => {
    const roles = retainSelectedMembershipRole(
      ["COLLEGE_ADMIN"], ["LEARNER", "COLLEGE_ADMIN"],
    );
    expect(roles).toEqual(["COLLEGE_ADMIN"]);
    expect(can(contextFor(roles), "people.manage", resource)).toBe(true);
  });

  it("fails closed when the selected role was revoked or selection is ambiguous", () => {
    expect(() => retainSelectedMembershipRole(["COLLEGE_ADMIN"], ["LEARNER"]))
      .toThrow("membership.role.manage");
    expect(() => retainSelectedMembershipRole([], ["COLLEGE_ADMIN"]))
      .toThrow("membership.role.manage");
    expect(() => retainSelectedMembershipRole(["LEARNER", "COLLEGE_ADMIN"], ["LEARNER", "COLLEGE_ADMIN"]))
      .toThrow("membership.role.manage");
  });
});

describe("account-bound auth cookies", () => {
  const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

  it("clears the previous person's selected role on successful login", () => {
    const source = read("src/app/api/auth/login/verify/route.ts");
    expect(source).toContain("clearAuthCookie(response, ROLE_COOKIE_NAME)");
  });

  it("clears the role alongside the device session and membership on logout", () => {
    const source = read("src/app/api/auth/session/route.ts");
    const names = source.split("clearAuthCookies(response, [")[1]?.split("]);")[0] ?? "";
    expect(names).toContain("SESSION_COOKIE_NAME");
    expect(names).toContain("MEMBERSHIP_COOKIE_NAME");
    expect(names).toContain("ROLE_COOKIE_NAME");
  });
});
