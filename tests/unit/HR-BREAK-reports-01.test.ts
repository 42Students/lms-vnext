import {describe,expect,it} from "vitest";
import {buildHrApplicantCsv,HR_APPLICANT_EXPORT_CAP}
 from "@/modules/placements/hr-applicant-export-model";
import {buildHrActivityCsv,HR_ACTIVITY_CSV_CAP}
 from "@/modules/placements/hr-activity-csv-model";
import {buildHrDrivesCsv,HR_DRIVE_CSV_CAP}
 from "@/modules/placements/hr-drives-csv-model";
import {buildHrInboxCsv,HR_INBOX_CSV_CAP}
 from "@/modules/placements/hr-inbox-csv-model";
import {buildHrCompanyReportCsv,HR_REPORT_EXPORT_CAP}
 from "@/modules/placements/hr-company-report-export-model";
import {buildRecruiterReportFunnel} from "@/modules/placements/recruiter-company-funnel-model";

const date=new Date("2026-10-18T10:00:00.000Z");
const malicious='=HYPERLINK("https://example.invalid","Download")';
const isSafe=(csv:string)=>{
 expect(csv).toContain("'=HYPERLINK");
 expect(csv.startsWith("\uFEFF")).toBe(true);
 expect(csv).not.toContain("Private phone:");
};

describe("HR-BREAK-reports-01: exports, formula injection, hidden contacts and pagination",()=>{
 it("applicants export only authorized rows supplied, masks contact and caps large results",()=>{
  const rows=Array.from({length:HR_APPLICANT_EXPORT_CAP+1},(_,i)=>({
   id:String(i),name:i===0?malicious:"Applicant",role:"Engineer",status:"SUBMITTED",
   screening:"SHORTLISTED",submittedAt:date,email:"private@example.invalid",phone:"9876543210",
  }));
  const output=buildHrApplicantCsv(rows,rows.length);
  expect(output.exported).toBe(HR_APPLICANT_EXPORT_CAP);
  expect(output.omitted).toBe(1);
  expect(output.csv).toContain("Masked");
  expect(output.csv).not.toContain("private@example.invalid");
  expect(output.csv).not.toContain("9876543210");
  isSafe(output.csv);
 });
 it("activity report neutralizes malicious titles, preserves IST dates and caps list",()=>{
  const rows=Array.from({length:HR_ACTIVITY_CSV_CAP+3},(_,i)=>({
   id:String(i),jobId:String(i),title:i===0?malicious:"Role",
   status:"PUBLISHED",occurredAt:date,
  }));
  const output=buildHrActivityCsv(rows,true);
  expect(output.exported).toBe(HR_ACTIVITY_CSV_CAP);
  expect(output.capped).toBe(true);
  expect(output.csv).toContain("Export capped");
  expect(output.csv).toContain("Occurred (IST)");
  isSafe(output.csv);
 });
 it("drives export is capped even if server accidentally passed overlong page",()=>{
  const rows=Array.from({length:HR_DRIVE_CSV_CAP+1},(_,i)=>({
   job:{id:String(i),title:i===0?malicious:"Engineer",status:"PUBLISHED",
    employmentType:"FULL_TIME",workMode:"REMOTE",applicationDeadline:date},
  }));
  const output=buildHrDrivesCsv(rows as never,false);
  expect(output.exported).toBe(HR_DRIVE_CSV_CAP);
  expect(output.truncated).toBe(true);
  expect(output.csv).toContain("Deadline (IST)");
  isSafe(output.csv);
 });
 it("notifications CSV honors export cap, unread state and avoids leaking message contents",()=>{
  const rows=Array.from({length:HR_INBOX_CSV_CAP+1},(_,i)=>({
   id:String(i),jobId:"job",title:i===0?malicious:"Engineer",
   label:"Drive status changed",createdAt:date,unread:i===0,
  }));
  const output=buildHrInboxCsv(rows,rows.length);
  expect(output.exported).toBe(HR_INBOX_CSV_CAP);
  expect(output.omitted).toBe(1);
  expect(output.csv).toContain("Unread");
  expect(output.csv).toContain('"Yes"');
  expect(output.csv).toContain('"No"');
  isSafe(output.csv);
 });
 it("company report uses persisted offer counts with the 200-row cap and safe CSV titles",()=>{
  const rows=Array.from({length:HR_REPORT_EXPORT_CAP+2},(_,i)=>({
   title:i===0?malicious:"Role",status:"PUBLISHED",applications:3,
   submittedApplications:2,withdrawnApplications:1,outstandingOffers:1,
   acceptedOffers:1,declinedOffers:0,joinedOffers:0,
  }));
  const output=buildHrCompanyReportCsv(rows as never,rows.length);
  expect(output.exported).toBe(HR_REPORT_EXPORT_CAP);
  expect(output.omitted).toBe(2);
  expect(output.csv).toContain("additional drives");
  isSafe(output.csv);
 });
 it("recruiter funnel clamps unsafe percentages and never fabricates events from a zero population",()=>{
  const zero=buildRecruiterReportFunnel({applied:0,shortlisted:0,assessment:0,interview:0,offered:0,hired:0});
  expect(zero.every(stage=>stage.appliedPercent===0)).toBe(true);
  expect(zero.every(stage=>stage.previousPercentLabel==="—")).toBe(true);
  const stages=buildRecruiterReportFunnel({applied:10,shortlisted:8,assessment:6,interview:4,offered:2,hired:1});
  expect(stages.map(item=>item.total)).toEqual([10,8,6,4,2,1]);
  expect(stages[1]?.appliedPercent).toBe(80);
  expect(stages[5]?.previousPercentLabel).toBe("50%");
 });
});