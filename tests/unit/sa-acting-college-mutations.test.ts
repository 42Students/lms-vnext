import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { requireActingCollege } from "@/modules/permissions/acting-college-policy";

const superAdmin: RequestContext = {
  user: { id: "sa", identityUid: "sa", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null,
  adminScope: { collegeId: "college-a", organizationId: "org-a" },
};
const collegeAdmin: RequestContext = {
  user: { id: "ca", identityUid: "ca", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "m-a", collegeId: "college-a", organizationId: "org-a", status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
  adminScope: null,
};

describe("SA-academics-people-05 SA-academics-people-R01 scoped academic mutation authorization", () => {
  it("permits a selected Super Admin only in the persisted matching college", () => {
    const actual = { collegeId: "college-a", organizationId: "org-a" };
    expect(requireActingCollege(superAdmin, "department.manage", actual)).toEqual(actual);
    expect(requireActingCollege(superAdmin, "academics.manage", actual)).toEqual(actual);
  });

  it("fails closed without a selected college or with a mismatched tenant", () => {
    expect(() => requireActingCollege({ ...superAdmin, adminScope: null },
      "department.manage", { collegeId: "college-a", organizationId: "org-a" })).toThrow();
    expect(() => requireActingCollege(superAdmin, "department.manage",
      { collegeId: "college-b", organizationId: "org-a" })).toThrow();
    expect(() => requireActingCollege(superAdmin, "academics.manage",
      { collegeId: "college-a", organizationId: "org-b" })).toThrow();
    expect(() => requireActingCollege(superAdmin, "academics.manage", null)).toThrow();
  });

  it("rejects suspended Super Admins and refuses non-admin impersonation", () => {
    expect(() => requireActingCollege({
      ...superAdmin, user: { ...superAdmin.user, platformStatus: "DISABLED" },
    }, "department.manage", { collegeId: "college-a", organizationId: "org-a" })).toThrow();
    expect(() => requireActingCollege({
      ...collegeAdmin, membership: { ...collegeAdmin.membership!, roles: ["FACULTY"] },
    }, "academics.manage")).toThrow();
  });

  it("keeps active College Admin membership scoped to its own college", () => {
    expect(requireActingCollege(collegeAdmin, "department.manage"))
      .toEqual({ collegeId: "college-a", organizationId: "org-a" });
    expect(requireActingCollege(collegeAdmin, "academics.manage"))
      .toEqual({ collegeId: "college-a", organizationId: "org-a" });
  });
});
