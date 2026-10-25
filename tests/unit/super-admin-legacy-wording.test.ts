import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RequestContext } from "@/modules/identity/context";
import {
  SUPER_ADMIN_LEGACY_GROUPS, superAdminLegacyGroupForPath,
} from "@/modules/people/super-admin-legacy-tabs-model";
import { getShellNavigation } from "@/components/shell/shell-model";

const superAdmin: RequestContext = {
  user: { id: "u", identityUid: "i", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null,
};

const src = (path: string) => readFileSync(`src/app/(authenticated)/${path}`, "utf8");

describe("Super Admin legacy label fixes that do not orphan pages (superAdminNavigationMenuFlat)", () => {
  const labels = getShellNavigation(superAdmin).map((i) => i.label);

  it.each([
    "Overview",
    "Feature Controls",
    "Profile verification",
    "Inbound mail",
    "Tenant Settings",
    "Activity Log",
    "Courses & Content",
    "People",
    "Placements",
    "Projects",
  ])("sidebar has the exact legacy label %s", (label) => {
    expect(labels).toContain(label);
  });

  it.each([
    "Dashboard",
    "Profile Verification",
    "Inbound Mail",
    "Settings",
    "Activity",
    "Recruiter Accounts",
  ])("sidebar no longer shows the vNext-only label %s", (label) => {
    expect(labels).not.toContain(label);
  });

  it("keeps the exact legacy label Recruiter accounts as a Placements tab", () => {
    expect(SUPER_ADMIN_LEGACY_GROUPS.find(g => g.title === "Placements")?.tabs)
      .toContainEqual({ label: "Recruiter accounts", href: "/admin/recruiters" });
  });

  it("page headings use the legacy titles", () => {
    expect(src("dashboard/page.tsx")).toContain('title="Dashboard"');
    // The public route delegates or passes through to the canonical setup workspace;
    // test the rendered page rather than expecting duplicate headings in the redirect wrapper.
    expect(src("admin/tenants/page.tsx")).toContain("<SuperAdminTenantSetup searchParams={Promise.resolve(raw)}");
    expect(src("admin/tenants/setup/page.tsx")).toContain('title="Tenant Setup"');
    expect(src("admin/settings/page.tsx")).toContain('title="Tenant Settings"');
    expect(src("admin/inbound-mail/page.tsx")).toContain('title="Inbound mail"');
    expect(src("admin/verification/page.tsx")).toContain('title="Profile verification"');
    expect(src("admin/hr/page.tsx")).toContain('title="Recruiter accounts"');
    expect(src("activity/page.tsx")).toContain('title="Activity Log"');
  });

  it("keeps every pre-existing Super Admin destination linked (nothing orphaned)", () => {
    const hrefs = [
      ...getShellNavigation(superAdmin).map((i) => i.href),
      ...SUPER_ADMIN_LEGACY_GROUPS.flatMap((g) => g.tabs.map((t) => t.href)),
    ];
    for (const href of [
      "/admin/organizations",
      "/admin/colleges",
      "/admin/departments",
      "/admin/lecture-halls",
      "/admin/attendance",
      "/admin/recruiters",
      "/admin/announcements",
      "/admin/placements/calendar",
    ]) {
      expect(hrefs).toContain(href);
    }
    // Owned by a group via its canonical tab (sidebar row replaced by a group row).
    for (const href of ["/admin/domains", "/admin/academics"]) {
      expect(superAdminLegacyGroupForPath(href), href).toBeDefined();
    }
  });
});
