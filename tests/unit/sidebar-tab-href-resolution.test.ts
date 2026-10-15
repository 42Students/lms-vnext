import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getShellNavigation } from "@/components/shell/shell-model";
import {
  SUPER_ADMIN_LEGACY_GROUPS, superAdminLegacyGroupForPath,
} from "@/modules/people/super-admin-legacy-tabs-model";
import { TPO_SETTINGS_NAV_GROUPS } from "@/components/placements/tpo-settings-nav";
import { TPO_MORE_GROUPS } from "@/modules/placements/tpo-utility-model";
import type { RequestContext } from "@/modules/identity/context";

const appRoot = join(process.cwd(), "src/app/(authenticated)");
const strip = (href: string) => href.split(/[?#]/)[0]!.replace(/\/$/, "") || "/";
const routeExists = (href: string) =>
  existsSync(join(appRoot, strip(href).slice(1), "page.tsx"));

const tpoCtx: RequestContext = {
  user: { id: "u", identityUid: "uid", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "m", collegeId: "c", organizationId: "o", status: "ACTIVE", roles: ["TPO"] },
};
const adminCtx: RequestContext = {
  user: { id: "u", identityUid: "uid", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null,
} as unknown as RequestContext;

/** Every previously sidebar-linked Super Admin / TPO page (pre-restructure). */
const PREVIOUSLY_LINKED_ADMIN = [
  "/admin/organizations", "/admin/colleges", "/admin/verification", "/admin/features",
  "/admin/departments", "/admin/academics", "/admin/lecture-halls", "/admin/attendance",
  "/admin/courses", "/admin/projects", "/admin/placements", "/admin/placements/calendar",
  "/admin/recruiters", "/admin/announcements", "/admin/inbound-mail", "/admin/people",
  "/admin/domains", "/admin/settings",
];
const PREVIOUSLY_LINKED_TPO = [
  "/tpo/home", "/tpo/batches", "/tpo/recruiters", "/tpo/placements", "/tpo/team",
  "/tpo/students", "/tpo/requests", "/tpo/calendar", "/tpo/reports", "/tpo/messages",
  "/tpo/settings", "/tpo/audit", "/tpo/notifications",
];

function adminReachable(): Set<string> {
  const set = new Set<string>();
  for (const item of getShellNavigation(adminCtx)) set.add(strip(item.href));
  for (const g of SUPER_ADMIN_LEGACY_GROUPS) for (const t of g.tabs) set.add(strip(t.href));
  return set;
}
function tpoReachable(): Set<string> {
  const set = new Set<string>();
  for (const item of getShellNavigation(tpoCtx)) set.add(strip(item.href));
  for (const g of TPO_SETTINGS_NAV_GROUPS)
    for (const i of g.items as readonly { href: string }[]) set.add(strip(i.href));
  for (const g of TPO_MORE_GROUPS)
    for (const l of g.links as readonly { href: string }[]) set.add(strip(l.href));
  return set;
}

describe("sidebar and tab hrefs resolve to real route files", () => {
  it("every Super Admin sidebar row and tab has a page", () => {
    for (const href of adminReachable()) expect(routeExists(href), href).toBe(true);
  });
  it("every TPO sidebar, settings and More link has a page", () => {
    for (const href of tpoReachable()) expect(routeExists(href), href).toBe(true);
  });
  it("no previously linked Super Admin page lost its link or tab owner", () => {
    const reach = adminReachable();
    const orphans = PREVIOUSLY_LINKED_ADMIN.filter(href =>
      !reach.has(href) && !superAdminLegacyGroupForPath(href));
    expect(orphans).toEqual([]);
  });
  it("no previously linked TPO page lost its link", () => {
    const reach = tpoReachable();
    expect(PREVIOUSLY_LINKED_TPO.filter(h => !reach.has(h))).toEqual([]);
  });
});
