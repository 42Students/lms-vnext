import { describe, expect, it } from "vitest";
import { adminUnassignedUsersHref, adminUnassignedUsersQuerySchema, unassignedIdentityPage, unassignedIdentityScopeAllowed } from "@/modules/people/admin-unassigned-user-model";
describe("Global unassigned identity directory", () => {
  it("requires both safety scope selections to be cleared", () => {
    expect(unassignedIdentityScopeAllowed(null)).toBe(true);
    expect(unassignedIdentityScopeAllowed({ collegeId: "college" })).toBe(false);
    expect(unassignedIdentityScopeAllowed({ organizationId: "org" })).toBe(false);
  });
  it("validates role/status filters and denies scope overrides", () => {
    expect(adminUnassignedUsersQuerySchema.safeParse({ platformStatus: "SUSPENDED" }).success).toBe(false);
    expect(adminUnassignedUsersQuerySchema.safeParse({ collegeId: "override" }).success).toBe(false);
    expect(adminUnassignedUsersHref({ q: "A & B", role: "NONE", platformStatus: "DISABLED", page: 2 }))
      .toBe("/admin/people/unassigned?q=A+%26+B&platformStatus=DISABLED&role=NONE&page=2");
  });
  it("clamps stale bookmarks without inventing empty later pages", () => {
    expect(unassignedIdentityPage(31, 999)).toEqual({ total: 31, totalPages: 2, page: 2, offset: 30 });
    expect(unassignedIdentityPage(0, 999).page).toBe(1);
  });
});
