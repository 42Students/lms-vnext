import { describe, expect, it } from "vitest";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";

const user = { id: "u1", identityUid: "identity", platformStatus: "ACTIVE" as const, systemRoles: [] as const };
const member = (roles: Array<"LEARNER" | "FACULTY" | "MENTOR" | "TPO" | "COLLEGE_ADMIN">,
  collegeId = "college-a", status: "ACTIVE" | "SUSPENDED" = "ACTIVE"): RequestContext => ({
  user, membership: { id: "m1", organizationId: "org-a", collegeId, status, roles },
});
const college = { collegeId: "college-a", organizationId: "org-a" };
describe("DB04 reviewer authorization policy", () => {
  it("permits own-college College Admin without TPO setting, denies cross college", () => {
    const admin = member(["COLLEGE_ADMIN"]);
    expect(can(admin, "profile-verification.review", college)).toBe(true);
    expect(can(admin, "profile-verification.review", {collegeId: "college-b", organizationId: "org-a"})).toBe(false);
    expect(can(member(["FACULTY"]), "profile-verification.review", college)).toBe(false);
    expect(can(member(["LEARNER"]), "profile-verification.review", college)).toBe(false);
    expect(can(member(["MENTOR"]), "profile-verification.review", college)).toBe(false);
  });

  it("requires both trusted server-side TPO admin attestation and enabled policy", () => {
    const tpo = member(["TPO"]);
    expect(can(tpo, "profile-verification.review", college)).toBe(false);
    expect(can(tpo, "profile-verification.review", {...college, tpoVerificationAdministrator: true})).toBe(false);
    expect(can(tpo, "profile-verification.review", {...college, tpoVerificationEnabled: true})).toBe(false);
    expect(can(tpo, "profile-verification.review", {...college,
      tpoVerificationEnabled: true, tpoVerificationAdministrator: true})).toBe(true);
    expect(can(tpo, "profile-verification.review", {
      collegeId: "college-b", organizationId: "org-a",
      tpoVerificationEnabled: true, tpoVerificationAdministrator: true,
    })).toBe(false);
  });

  it("rejects suspended memberships and disabled platform accounts", () => {
    expect(can(member(["COLLEGE_ADMIN"], "college-a", "SUSPENDED"),
      "profile-verification.review", college)).toBe(false);
    const disabled: RequestContext = { ...member(["TPO"]), user: { ...user, platformStatus: "DISABLED" }};
    expect(can(disabled, "profile-verification.review",
      {...college, tpoVerificationEnabled: true, tpoVerificationAdministrator: true})).toBe(false);
  });

  it("respects scoped superadmin safety rails", () => {
    const root: RequestContext = { user: { ...user, systemRoles: ["SUPER_ADMIN"] }, membership: null };
    const locked: RequestContext = { ...root,
      adminScope: { organizationId: "org-a", collegeId: "college-a" } };
    expect(can(root, "profile-verification.review", college)).toBe(true);
    expect(can(locked, "profile-verification.review", college)).toBe(true);
    expect(can(locked, "profile-verification.review",
      {collegeId: "college-b", organizationId: "org-a"})).toBe(false);
  });

  it("throws on missing review permission", () => {
    expect(() => requirePermission(member(["TPO"]), "profile-verification.review", college))
      .toThrowError(AuthorizationError);
  });
});
