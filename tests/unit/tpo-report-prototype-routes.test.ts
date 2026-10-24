import {describe,expect,it} from "vitest";
import {tpoPrototypeReportRoute} from "@/modules/placements/tpo-report-prototype-routes";
describe("TPO Reports prototype directory destinations",()=>{
 it("maps old labels to existing route implementations",()=>{
  expect(tpoPrototypeReportRoute("/tpo/reports/outcomes")).toBe("/tpo/reports/after-college");
  expect(tpoPrototypeReportRoute("/tpo/reports/recruiter-leads")).toBe("/tpo/reports/leads");
 });
 it("retains valid detailed/overview report destinations",()=>{
  for(const path of ["/tpo/reports/unplaced","/tpo/reports/placement-summary",
   "/tpo/reports/by-branch","/tpo/reports/ctc",
   "/tpo/reports/accreditation"]){
   expect(tpoPrototypeReportRoute(path)).toBe(path);
  }
 });
});
