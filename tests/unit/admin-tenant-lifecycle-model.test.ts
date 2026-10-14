import { describe, expect, it } from "vitest";
import { tenantLifecycleHref, tenantLifecyclePaging, tenantLifecycleQuerySchema, tenantSetupLinksAvailable } from "@/modules/colleges/admin-tenant-lifecycle-model";
describe("Super Admin tenant lifecycle reads", () => {
  it("preserves Active default and lifecycle filters through clamped paging", () => {
    expect(tenantLifecycleQuerySchema.parse({}).status).toBe("ACTIVE");
    expect(tenantLifecycleHref({ status: "ARCHIVED", q: "College", page: 2 })).toBe("/admin/tenants?q=College&status=ARCHIVED&page=2");
    expect(tenantLifecyclePaging(21, 999)).toEqual({ total: 21, totalPages: 2, page: 2, offset: 20 });
    expect(tenantLifecyclePaging(0, 999).page).toBe(1);
  });
  it("does not show setup links for an archived college or organization", () => {
    expect(tenantSetupLinksAvailable("ACTIVE", "ACTIVE")).toBe(true);
    expect(tenantSetupLinksAvailable("ARCHIVED", "ACTIVE")).toBe(false);
    expect(tenantSetupLinksAvailable("ACTIVE", "ARCHIVED")).toBe(false);
    expect(tenantLifecycleQuerySchema.safeParse({ collegeId: "override" }).success).toBe(false);
    expect(tenantLifecycleQuerySchema.safeParse({ status: "DISABLED" }).success).toBe(false);
  });
});
