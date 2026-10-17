import {describe,it,expect} from "vitest";
import {buildRecruiterReportFunnel} from "@/modules/placements/recruiter-company-funnel-model";
describe("REC-calendar-messages-profile-31 whole-college pipeline",()=>{
 it("calculates funnel ratios with stable legacy headings",()=>{
  const rows=buildRecruiterReportFunnel({
   applied:100,shortlisted:60,assessment:50,interview:25,offered:10,hired:5});
  expect(rows.map(row=>row.label)).toEqual(["Shared applicants","Shortlisted","Assessment","Interview","Offered","Hired"]);
  expect(rows[1]?.previousPercentLabel).toBe("60%");
  expect(rows[5]?.appliedPercent).toBe(5);
 });
 it("does not divide by zero or fabricate stages",()=>{
  expect(buildRecruiterReportFunnel({applied:0,shortlisted:0,assessment:0,interview:0,offered:0,hired:0})
   .every(row=>row.previousPercentLabel==="—"&&row.appliedPercent===0)).toBe(true);
 });
});
