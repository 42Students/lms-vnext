import { describe, expect, it } from "vitest";
import { courseOfferingIdSchema } from "@/modules/courses/validation";
import { resourceVisibleInAdminScope } from "@/modules/admin-ui/super-admin-resource-scope-model";
describe("Super Admin course-offering URL model", () => {
  it("rejects invalid offering IDs before database lookup", () => {
    expect(courseOfferingIdSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(courseOfferingIdSchema.safeParse("00000000-0000-4000-8000-000000000001").success).toBe(true);
  });
  it("does not follow cross-college detail URLs", () => {
    const row = { collegeId: "a", organizationId: "org" };
    expect(resourceVisibleInAdminScope({ collegeId: "b", organizationId: "org" }, row)).toBe(false);
    expect(resourceVisibleInAdminScope({ collegeId: "a", organizationId: "other" }, row)).toBe(false);
    expect(resourceVisibleInAdminScope({ collegeId: "a", organizationId: "org" }, row)).toBe(true);
  });
});
