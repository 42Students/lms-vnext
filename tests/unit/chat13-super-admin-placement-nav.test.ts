import { describe, expect, it } from "vitest";
import {
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,
  SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL,
} from "@/modules/placements/super-admin-placement-nav-model";

describe("Super Admin placement navigation", () => {
  it("SA-placements-projects-50 sends Interviews to the legacy calendar and links Applications", () => {
    const interviews = SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY.filter(x => x.label === "Interviews");
    expect(interviews).toEqual([{ href: "/admin/placements/calendar", label: "Interviews" }]);
    expect(SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY.some(x =>
      x.href === "/admin/placements/applications" && x.label === "Applications")).toBe(true);
    expect(SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY.map(x => x.href)).not.toContain("/admin/placements/interviews");
    expect(SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY.some(x => x.label === "Placement Analytics")).toBe(true);
    expect(SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL.map(x => x.label)).toContain("Offers");
    const paths = [...SUPER_ADMIN_PLACEMENT_OVERSIGHT_PRIMARY,
      ...SUPER_ADMIN_PLACEMENT_OVERSIGHT_ADDITIONAL].map(x => x.href);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
