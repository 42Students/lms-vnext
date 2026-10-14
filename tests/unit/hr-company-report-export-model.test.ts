import {describe,expect,it} from "vitest";
import {buildHrCompanyReportCsv,HR_REPORT_EXPORT_CAP} from "@/modules/placements/hr-company-report-export-model";
import type {RecruiterReportRow} from "@/modules/placements/recruiter-company-reports-model";
const row:RecruiterReportRow={id:"j",title:" =HYPERLINK(1,2)",status:"PUBLISHED",
 employmentType:"FULL_TIME",publishedAt:null,closedAt:null,
 applications:2,submittedApplications:2,withdrawnApplications:0,
 outstandingOffers:1,acceptedOffers:1,declinedOffers:0,joinedOffers:1};
describe("recruiter company report CSV",()=>{
 it("escapes formula titles and omits candidate PII",()=>{
  const result=buildHrCompanyReportCsv([row],1);
  expect(result.csv).toContain("' =HYPERLINK");
  expect(result.csv).not.toContain("@example.test");
  expect(result.exported).toBe(1);
 });
 it("caps at 200 records",()=>{
  const result=buildHrCompanyReportCsv(Array.from({length:HR_REPORT_EXPORT_CAP+1},(_,i)=>({...row,id:String(i)})),201);
  expect(result.exported).toBe(200);
  expect(result.omitted).toBe(1);
 });
});
