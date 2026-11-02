import { describe, expect, it } from "vitest";
import type { MembershipRole } from "@/modules/identity/constants";
import type { AdminScope, RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission, type PlatformPermission } from "@/modules/permissions/policy";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COLLEGE_A = "22222222-2222-4222-8222-222222222222";
const COLLEGE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER = "33333333-3333-4333-8333-333333333333";

function superAdmin(scope: AdminScope | null = null, status = "ACTIVE"): RequestContext {
  return {
    user: { id: USER, identityUid: "u", platformStatus: status as never, systemRoles: ["SUPER_ADMIN"] },
    membership: null,
    adminScope: scope,
  };
}
function member(role: MembershipRole, over: Partial<RequestContext> = {}): RequestContext {
  return {
    user: { id: USER, identityUid: "u", platformStatus: "ACTIVE", systemRoles: [] },
    membership: { id: USER, collegeId: COLLEGE_A, organizationId: ORG_A, status: "ACTIVE", roles: [role] },
    adminScope: null,
    ...over,
  };
}
const inA = { organizationId: ORG_A, collegeId: COLLEGE_A };
const inB = { organizationId: ORG_B, collegeId: COLLEGE_B };

describe("Phase 3: Super Admin permission policy", () => {
  describe("an unscoped Super Admin (platform view)", () => {
    const ctx = superAdmin();
    it("may select a scope and manage system roles and the global template catalogue", () => {
      expect(can(ctx, "admin-scope.select")).toBe(true);
      expect(can(ctx, "system-role.manage")).toBe(true);
      expect(can(ctx, "project-template.manage")).toBe(true);
      expect(can(ctx, "project-template.read")).toBe(true);
    });
    it("may act on any college or organization", () => {
      expect(can(ctx, "college.manage", inA)).toBe(true);
      expect(can(ctx, "college.manage", inB)).toBe(true);
      expect(can(ctx, "organization.manage", { organizationId: ORG_B })).toBe(true);
    });
  });

  describe("a Super Admin with a selected college", () => {
    const ctx = superAdmin({ organizationId: ORG_A, collegeId: COLLEGE_A });
    it("may manage the selected college only", () => {
      expect(can(ctx, "college.manage", inA)).toBe(true);
      expect(can(ctx, "college.manage", inB)).toBe(false);
    });
    it("is refused a resource that names no college, so an omitted id cannot widen scope", () => {
      expect(can(ctx, "college.manage", {})).toBe(false);
      expect(can(ctx, "college.manage", { organizationId: ORG_A })).toBe(false);
    });
    it("is refused the right college id under a different organization", () => {
      expect(can(ctx, "college.manage", { organizationId: ORG_B, collegeId: COLLEGE_A })).toBe(false);
    });
    it("loses global-only powers while a scope is selected, but keeps scope switching", () => {
      expect(can(ctx, "system-role.manage")).toBe(false);
      expect(can(ctx, "project-template.manage")).toBe(false);
      expect(can(ctx, "admin-scope.select")).toBe(true);
    });
  });

  describe("a Super Admin with a selected organization", () => {
    const ctx = superAdmin({ organizationId: ORG_A, collegeId: null });
    it("may act inside that organization only", () => {
      expect(can(ctx, "organization.manage", { organizationId: ORG_A })).toBe(true);
      expect(can(ctx, "organization.manage", { organizationId: ORG_B })).toBe(false);
      expect(can(ctx, "college.manage", {})).toBe(false);
    });
  });

  describe("a suspended or inactive Super Admin", () => {
    for (const status of ["SUSPENDED", "DEACTIVATED", "PENDING", ""]) {
      it(`is refused everything, including self-service, when platformStatus is "${status}"`, () => {
        const ctx = superAdmin(null, status);
        for (const permission of ["admin-scope.select", "system-role.manage", "college.manage", "identity.self.manage"] as PlatformPermission[]) {
          expect(can(ctx, permission, inA)).toBe(false);
        }
      });
    }
  });

  describe("Super Admin only permissions are closed to every other identity", () => {
    const others: Array<[string, RequestContext | null | undefined]> = [
      ["LEARNER", member("LEARNER")],
      ["FACULTY", member("FACULTY")],
      ["COLLEGE_ADMIN", member("COLLEGE_ADMIN")],
      ["MENTOR", member("MENTOR")],
      ["TPO", member("TPO")],
      ["null context", null],
      ["undefined context", undefined],
    ];
    for (const [name, ctx] of others) {
      it(`${name} cannot select a scope, manage system roles or the template catalogue`, () => {
        for (const permission of ["admin-scope.select", "system-role.manage", "project-template.manage", "project-template.read", "organization.manage"] as PlatformPermission[]) {
          expect(can(ctx, permission, inA), `${name} -> ${permission}`).toBe(false);
        }
      });
    }
  });

  describe("a College Admin is confined to their own college", () => {
    const ctx = member("COLLEGE_ADMIN");
    it("manages the home college", () => {
      expect(can(ctx, "college.manage", inA)).toBe(true);
      expect(can(ctx, "people.manage", inA)).toBe(true);
    });
    it("cannot manage another college, or the right college id under another organization", () => {
      expect(can(ctx, "college.manage", inB)).toBe(false);
      expect(can(ctx, "college.manage", { organizationId: ORG_B, collegeId: COLLEGE_A })).toBe(false);
    });
    it("cannot manage an organization, assign templates or omit the college", () => {
      expect(can(ctx, "organization.manage", { organizationId: ORG_A })).toBe(false);
      expect(can(ctx, "project-template.assign", inA)).toBe(false);
      expect(can(ctx, "college.manage", {})).toBe(false);
    });
  });

  describe("an admin-scope cookie never grants anything to a non-Super-Admin", () => {
    it("a College Admin who forges a scope for another college still cannot act there", () => {
      const ctx = member("COLLEGE_ADMIN", { adminScope: { organizationId: ORG_B, collegeId: COLLEGE_B } });
      expect(can(ctx, "college.manage", inB)).toBe(false);
      expect(can(ctx, "college.manage", inA)).toBe(true);
    });
    it("a Learner who forges a scope gains no management or cross-college read", () => {
      const ctx = member("LEARNER", { adminScope: { organizationId: ORG_B, collegeId: COLLEGE_B } });
      expect(can(ctx, "college.manage", inB)).toBe(false);
      expect(can(ctx, "college.read", inB)).toBe(false);
      expect(can(ctx, "admin-scope.select")).toBe(false);
    });
  });

  describe("a forged membership role cannot stand in for Super Admin", () => {
    it("a membership claiming roles:['SUPER_ADMIN'] is refused", () => {
      const ctx = member("LEARNER", {
        membership: { id: USER, collegeId: COLLEGE_A, organizationId: ORG_A, status: "ACTIVE", roles: ["SUPER_ADMIN" as never] },
      });
      expect(can(ctx, "college.manage", inA)).toBe(false);
      expect(can(ctx, "admin-scope.select")).toBe(false);
    });
    it("a College Admin membership that is not ACTIVE is refused", () => {
      const ctx = member("COLLEGE_ADMIN", {
        membership: { id: USER, collegeId: COLLEGE_A, organizationId: ORG_A, status: "SUSPENDED" as never, roles: ["COLLEGE_ADMIN"] },
      });
      expect(can(ctx, "college.manage", inA)).toBe(false);
    });
  });

  describe("role boundaries on the placements and people permissions", () => {
    it("only TPO and College Admin manage placements; learners may read them", () => {
      expect(can(member("TPO"), "placements.manage", inA)).toBe(true);
      expect(can(member("COLLEGE_ADMIN"), "placements.manage", inA)).toBe(true);
      expect(can(member("LEARNER"), "placements.manage", inA)).toBe(false);
      expect(can(member("LEARNER"), "placements.read", inA)).toBe(true);
      expect(can(member("MENTOR"), "placements.read", inA)).toBe(false);
    });
    it("only a College Admin manages people and membership roles", () => {
      for (const role of ["LEARNER", "FACULTY", "MENTOR", "TPO"] as MembershipRole[]) {
        expect(can(member(role), "people.manage", inA), role).toBe(false);
        expect(can(member(role), "membership.role.manage", inA), role).toBe(false);
      }
      expect(can(member("COLLEGE_ADMIN"), "membership.role.manage", inA)).toBe(true);
    });
  });

  describe("requirePermission", () => {
    it("throws an AuthorizationError naming the missing permission", () => {
      expect(() => requirePermission(member("LEARNER"), "college.manage", inA)).toThrow(AuthorizationError);
      expect(() => requirePermission(member("LEARNER"), "college.manage", inA)).toThrow("Missing permission: college.manage");
    });
    it("does not throw for an allowed identity", () => {
      expect(() => requirePermission(superAdmin(), "admin-scope.select")).not.toThrow();
    });
  });
});
