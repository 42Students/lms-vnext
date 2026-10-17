import {describe,expect,it} from "vitest";
import {TPO_SETTINGS_NAV_GROUPS} from "@/components/placements/tpo-settings-nav";
describe("TPO-settings-audit-01 legacy primary Settings sections",()=>{
 it("keeps the ten legacy sections in original group order alongside linked destinations",()=>{
  expect(TPO_SETTINGS_NAV_GROUPS.map(g=>g.title)).toEqual(["Placement policy","People","Students and companies"]);
  const labels=TPO_SETTINGS_NAV_GROUPS.flatMap(g=>(g.items as readonly {label:string}[]).map(x=>x.label));
  expect(labels).toEqual([
   "Placement seasons","Placement rules","Job types","After college","Prep readiness","Blocked dates",
   "Trusted domains","Recruiters","Placement Team","Public recruiter link",
   "Student Notices & Preparation","My Notifications","Email templates","What companies see","Placements page","Branding",
  ]);
  const legacy=["Placement rules","Job types","After college","Prep readiness","Blocked dates",
   "Recruiters","Student Notices & Preparation","What companies see","Placements page","Branding"];
  expect(labels.filter(label=>legacy.includes(label))).toEqual(legacy);
  expect(TPO_SETTINGS_NAV_GROUPS.flatMap(g=>[...g.items] as {href:string}[]).every(x=>x.href.startsWith("/tpo/settings/"))).toBe(true);
 });
});
