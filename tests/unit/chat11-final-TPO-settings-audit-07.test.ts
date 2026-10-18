import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {TPO_SETTINGS_NAV_GROUPS} from "@/components/placements/tpo-settings-nav";
describe("TPO final sprint settings navigation",()=>{
 it("TPO-settings-audit-07 preserves distinct legacy sections without losing active-page navigation",()=>{
  const source=readFileSync("src/components/placements/tpo-settings-nav.tsx","utf8");
  expect(TPO_SETTINGS_NAV_GROUPS.map(group=>group.title)).toEqual(["Placement policy","People","Students and companies"]);
  const allIds:string[] = [];
  for(const group of TPO_SETTINGS_NAV_GROUPS){
   for(const item of group.items){
    allIds.push(item.id);
    expect(item.href.startsWith("/tpo/settings/")).toBe(true);
   }
  }
  expect(new Set(allIds).size).toBe(16);
  expect(source).toContain('aria-current={active===item.id?"page":undefined}');
  expect(source).toContain("md:sticky md:top-4 md:float-left");
  expect(source).toContain("flex flex-wrap gap-2 md:flex-col");
  expect(source).not.toContain('>More</Link>');
 });
});