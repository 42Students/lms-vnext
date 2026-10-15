import {describe,expect,it} from "vitest";
import {TPO_TOPBAR_QUICK_LINKS} from "@/modules/placements/tpo-topbar-links";
describe("TPO exact legacy topbar action paths",()=>{
 it("offers Follow-up, Recruiter lead and Drive in the legacy order",()=>{
  expect(TPO_TOPBAR_QUICK_LINKS).toEqual([
   {label:"Follow-up",href:"/tpo/follow-ups"},
   {label:"Recruiter lead",href:"/tpo/recruiters?add=1"},
   {label:"Drive",href:"/tpo/placements/new"},
  ]);
 });
});
