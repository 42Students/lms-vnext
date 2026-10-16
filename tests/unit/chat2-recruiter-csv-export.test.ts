import {describe,expect,it} from "vitest";
import {recruiterCsvCell,recruiterLeadsCsv} from "@/modules/placements/tpo-recruiter-export-model";
describe("TPO-recruiters-19 safe export",()=>{
 it("neutralizes spreadsheet formulas and quotes commas",()=>{
  expect(recruiterCsvCell("=HYPERLINK(1)")).toBe('"\'=HYPERLINK(1)"');
  expect(recruiterCsvCell("A,B")).toBe('"A,B"');
 });
 it("exports only selected, explicitly projected fields",()=>{
  const csv=recruiterLeadsCsv([{name:"Recruiter",companyName:"Acme",stage:"NEW",ownerName:null,
   emailNorm:"recruiter@acme.com",phoneNorm:null,source:null,inviteStatus:"NOT_INVITED",
   lastActivityAt:null,nextFollowupAt:null,createdAt:"2026-10-16"}]);
  expect(csv).toContain("recruiter@acme.com");
  expect(csv).not.toContain("tokenHash");
 });
});
