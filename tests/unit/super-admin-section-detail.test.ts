import { describe, expect, it } from "vitest";
import { resourceVisibleInAdminScope } from "@/modules/admin-ui/super-admin-resource-scope-model";

const actual = { collegeId: "college-a", organizationId: "org-a" };
describe("Super Admin section URL safety scope", () => {
  it("requires the exact selected college, not just an organization", () => {
    expect(sectionVisibleInAdminScope(null, actual)).toBe(false);
    expect(sectionVisibleInAdminScope({ collegeId: null, organizationId: "org-a" }, actual)).toBe(false);
    expect(sectionVisibleInAdminScope({ collegeId: "college-b", organizationId: "org-a" }, actual)).toBe(false);
    expect(sectionVisibleInAdminScope({ collegeId: "college-a", organizationId: "org-b" }, actual)).toBe(false);
    expect(sectionVisibleInAdminScope({ collegeId: "college-a", organizationId: "org-a" }, actual)).toBe(true);
  });
});
