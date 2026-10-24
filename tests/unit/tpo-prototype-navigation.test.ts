import {describe,expect,it} from "vitest";
import {TPO_PROTOTYPE_NAV,TPO_PROTOTYPE_SECTIONS,tpoPrototypeSectionForPath,tpoPrototypeSidebarActive}
 from "@/components/shell/tpo-prototype-navigation";
describe("TPO prototype's eight top-level destinations",()=>{
 it("has exactly the reference sections in their reference order",()=>{
  expect(TPO_PROTOTYPE_NAV.map(row=>row.label))
   .toEqual(["Home","Students","Drives","Companies","Calendar","Team","Reports","Settings"]);
  expect(new Set(TPO_PROTOTYPE_NAV.map(row=>row.href)).size).toBe(8);
 });
 it("keeps legacy work reachable through owner sections",()=>{
  expect(TPO_PROTOTYPE_SECTIONS.Students.map(item=>item.label))
   .toEqual(["All students","Who's in placements","To verify","Requests","Announcements","Eligibility"]);
  expect(TPO_PROTOTYPE_SECTIONS.Companies.slice(0,5).map(item=>item.label))
   .toEqual(["Today","Recruiters","Companies","Emails","Messages"]);
 });
 it.each([
  ["/tpo/students/123","Students"],["/tpo/requests","Students"],["/tpo/batches","Students"],
  ["/tpo/placements/jobs/abc","Drives"],["/tpo/drive-day","Drives"],
  ["/tpo/recruiters/123","Companies"],["/tpo/messages","Companies"],
  ["/tpo/companies/today","Companies"],["/tpo/settings/team","Team"],
  ["/tpo/calendar","Calendar"],["/tpo/reports/placement-summary","Reports"],["/tpo/audit","Settings"],
 ])("%s activates only %s", (path,expected)=>{
  expect(tpoPrototypeSectionForPath(path)).toBe(expected);
  expect(TPO_PROTOTYPE_NAV.filter(item=>tpoPrototypeSidebarActive(path,item)).map(item=>item.label))
   .toEqual([expected]);
 });
});
