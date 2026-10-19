import { describe, expect, it } from "vitest";
import { legacySidebarItemActive } from "@/components/shell/legacy-sidebar-active-model";

const item = (label: string, href: string) => ({ label, href });

describe("chat-19 recruiter sidebar active route aliases", () => {
  it("keeps the five-row legacy recruiter navigation active throughout hiring work", () => {
    const drives = item("Drives", "/hr/drives");
    const routes = [
      "/hr/placements",
      "/hr/placements/jobs/123",
      "/hr/placements/jobs/123/overview",
      "/hr/round-results",
      "/recruiter/drives",
      "/recruiter/drives/123",
      "/hr/drives/new",
    ];
    for (const route of routes) {
      expect(legacySidebarItemActive(route, drives, null, null), route).toBe(true);
    }
    expect(legacySidebarItemActive("/hr/company", drives, null, null)).toBe(false);
    expect(legacySidebarItemActive("/hr/home", drives, null, null)).toBe(false);
  });

  it("recognizes the recruiter Messages alias, not notification pages", () => {
    const messages = item("Messages", "/hr/conversations");
    for (const route of ["/hr/messages", "/hr/conversations", "/hr/conversations/abc"]) {
      expect(legacySidebarItemActive(route, messages, null, null), route).toBe(true);
    }
    expect(legacySidebarItemActive("/hr/notifications", messages, null, null)).toBe(false);
  });
});
