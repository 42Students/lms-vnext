import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
const userId = "00000000-0000-4000-8000-000000000001";
const org = "00000000-0000-4000-8000-000000000002";
const college = "00000000-0000-4000-8000-000000000003";
function admin(scope: RequestContext["adminScope"]): RequestContext {
  return { user: { id: userId, identityUid: "template-scope", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
    membership: null, adminScope: scope };
}
describe("Super Admin global template read vs write", () => {
  it("reads in global, organization and college scopes without unlocking writes", () => {
    for (const scope of [null, { organizationId: org, collegeId: null }, { organizationId: org, collegeId: college }]) {
      expect(can(admin(scope), "project-template.read")).toBe(true);
      expect(can(admin(scope), "project-template.manage")).toBe(scope === null);
    }
  });
  it("rejects wrong role and disabled Super Admin", () => {
    expect(can({ ...admin(null), user: { ...admin(null).user, systemRoles: [] } }, "project-template.read")).toBe(false);
    expect(can({ ...admin(null), user: { ...admin(null).user, platformStatus: "DISABLED" } }, "project-template.read")).toBe(false);
  });
});
