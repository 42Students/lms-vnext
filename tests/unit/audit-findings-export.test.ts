import {describe,it,expect} from "vitest";
import {auditFindingsCsv} from "@/modules/bug-tracker/audit-findings-csv-model";
describe("Super Admin DB10 findings page export",()=>{
 it("sanitizes spreadsheet formulas and never exports reporter PII",()=>{
  const csv=auditFindingsCsv([{publicId:"LMS-1234",status:"NEW",severity:"MAJOR",environment:"UAT",issueType:"=FORMULA",page:"/learn",createdAt:new Date("2026-10-15T00:00:00Z")}]);
  expect(csv).toContain("'=FORMULA");
  expect(csv).not.toContain("Reporter");
  expect(csv.split("\r\n").filter(Boolean)).toHaveLength(2);
 });
});