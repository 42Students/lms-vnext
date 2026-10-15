import { describe, expect, it } from "vitest";
import { SUPER_ADMIN_GLOBAL_LINKS, SUPER_ADMIN_COLLEGE_LINKS } from "@/modules/admin-ui/admin-dashboard-navigation";
describe("Super Admin dashboard global vs college navigation", () => {
  it("has no disabled placeholders for existing global routes", () => {
    expect(SUPER_ADMIN_GLOBAL_LINKS.every(link => link.href.startsWith("/admin/")||link.href==="/tracker/audit-findings")).toBe(true);
    expect(SUPER_ADMIN_GLOBAL_LINKS.map(link => link.label)).toEqual([
      "Tenant Setup", "Feature Controls", "Activity Log",
    ]);
  });
  it("exposes only known college-scoped destinations, no writes embedded in links", () => {
    expect(SUPER_ADMIN_COLLEGE_LINKS).toHaveLength(8);
    expect(SUPER_ADMIN_COLLEGE_LINKS.every(link => link.href.startsWith("/admin/")||link.href==="/tracker/audit-findings")).toBe(true);
    expect(new Set(SUPER_ADMIN_COLLEGE_LINKS.map(link => link.href)).size).toBe(8);
  });
});
