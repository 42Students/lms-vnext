import {describe,expect,it} from "vitest";
import {TPO_SETTINGS_NAV_GROUPS} from "@/components/placements/tpo-settings-nav";
describe("TPO-settings-audit-01 legacy primary Settings sections",()=>{
 it("keeps the ten legacy sections in original group order alongside linked destinations",()=>{
  expect(TPO_SETTINGS_NAV_GROUPS.map(g=>g.title)).toEqual(["Placement policy","People","Students and companies"]);
  const labels=TPO_SETTINGS_NAV_GROUPS.flatMap(g=>(g.items as readonly {label:string}[]).map(x=>x.label));
  expect(labels).toEqual([
   "Placement seasons","Placement Rules","Job types","After college","Prep readiness","Blocked dates",
   "Trusted domains","Recruiter access","Placement Team","Public recruiter link",
   "Student Notices & Preparation","My Notifications","Email templates","What Companies See","Public placements","Placement Branding",
  ]);
  const legacy=["Placement Rules","Job types","After college","Prep readiness","Blocked dates",
   "Recruiter access","Student Notices & Preparation","What Companies See","Public placements","Placement Branding"];
  expect(labels.filter(label=>legacy.includes(label))).toEqual(legacy);
  expect(TPO_SETTINGS_NAV_GROUPS.flatMap(g=>[...g.items] as {href:string}[]).every(x=>x.href.startsWith("/tpo/settings/"))).toBe(true);
 });
});
