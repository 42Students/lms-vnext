import { describe, expect, it } from "vitest";
import { TPO_SECTION_LABELS, getShellNavigation } from "@/components/shell/shell-model";
import { TPO_SETTINGS_NAV_GROUPS } from "@/components/placements/tpo-settings-nav";
import { TPO_MORE_GROUPS } from "@/modules/placements/tpo-utility-model";
import type { RequestContext } from "@/modules/identity/context";

describe("TPO exact sidebar groups and secondary route reachability", () => {
 const ctx: RequestContext = {
  user:{id:"u",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"m",collegeId:"c",organizationId:"o",status:"ACTIVE",roles:["TPO"]},
 };
 it("renders the four section headers without an extra sidebar link", () => {
  expect(Object.values(TPO_SECTION_LABELS)).toEqual([
    "Operate", "Coordinate", "Insights", "Administration",
  ]);
  const links = getShellNavigation(ctx);
  expect(links.map(x => x.group)).toEqual([
    ...Array(5).fill("operate"),...Array(5).fill("coordinate"),
    "insights",...Array(4).fill("administration"),
  ]);
  for (const absent of ["Companies","More","Dashboard"]) {
    expect(links.some(x => x.label === absent)).toBe(false);
  }
 });
 it("preserves companies as an Engage tab and More as a Settings tab", () => {
  expect(TPO_MORE_GROUPS.flatMap(group => group.links).some(item =>
    item.label === "Companies" && item.href === "/tpo/recruiters?view=companies",
  )).toBe(true);
  expect(TPO_SETTINGS_NAV_GROUPS.flatMap(group=>group.items).some(item =>
    item.label === "More" && item.href === "/tpo/more",
  )).toBe(true);
 });
});
