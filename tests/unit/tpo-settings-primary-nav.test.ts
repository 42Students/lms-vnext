import {describe,expect,it} from "vitest";
import {TPO_SETTINGS_NAV_GROUPS} from "@/components/placements/tpo-settings-nav";
describe("TPO-settings-audit-01 legacy primary Settings sections",()=>{
 it("keeps ten visible legacy sections in original group order",()=>{
  expect(TPO_SETTINGS_NAV_GROUPS.map(g=>g.title)).toEqual(["Placement policy","People","Students and companies"]);
  expect(TPO_SETTINGS_NAV_GROUPS.flatMap(g=>g.items.map(x=>x.label))).toEqual([
   "Placement rules","Job types","After college","Prep readiness","Blocked dates",
   "Recruiters","Student notices","What companies see","Placements page","Branding",
  ]);
  expect(TPO_SETTINGS_NAV_GROUPS.flatMap(g=>g.items).every(x=>x.href.startsWith("/tpo/settings/"))).toBe(true);
 });
});
