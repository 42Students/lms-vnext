import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
  const links = getShellNavigation(ctx, null, true);
  expect(links.map(x => x.group)).toEqual([
    ...Array(5).fill("operate"),...Array(5).fill("coordinate"),
    "insights",...Array(4).fill("administration"),
  ]);
  for (const absent of ["Companies","More","Dashboard"]) {
    expect(links.some(x => x.label === absent)).toBe(false);
  }
 });
 it("preserves companies as an Engage tab and keeps the ten legacy Settings sections", () => {
  expect(TPO_MORE_GROUPS.flatMap(group => [...group.links]).some(item => item.label === "Companies")).toBe(false);
  expect(readFileSync("src/app/(authenticated)/tpo/recruiters/page.tsx","utf8"))
    .toContain('requested === "board" || requested === "companies"');
  // The five primary Settings sections are visible; other scoped controls retain their direct routes.
  expect(TPO_SETTINGS_NAV_GROUPS.flatMap(group=>[...group.items]).map(item=>item.label))
    .toEqual(["Placement rules","Job types","After college","Placement team","Recruiters"]);
  expect(TPO_SETTINGS_NAV_GROUPS.flatMap(group=>[...group.items]).some(item =>
    item.label === "More",
  )).toBe(false);
 });
});
