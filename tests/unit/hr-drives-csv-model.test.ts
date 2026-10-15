import {describe,expect,it} from "vitest";
import {buildHrDrivesCsv,HR_DRIVE_CSV_CAP} from "@/modules/placements/hr-drives-csv-model";
import type {RecruiterDriveListItem} from "@/modules/placements/recruiter-drive-list-model";
const row:RecruiterDriveListItem={collegeId:"own",job:{
 id:"job",title:"  =HYPERLINK(1,2)",status:"PUBLISHED",archivedAt:null,
 employmentType:"FULL_TIME",workMode:"HYBRID",applicationDeadline:new Date("2026-10-15T11:00:00Z")}};
describe("recruiter drives CSV",()=>{
 it("escapes dangerous titles without including candidate information",()=>{
  const result=buildHrDrivesCsv([row],false);
  expect(result.csv).toContain("'  =HYPERLINK");
  expect(result.csv).not.toContain("Applicant email");
  expect(result.exported).toBe(1);
  expect(result.truncated).toBe(false);
 });
 it("caps at two hundred regardless of caller mistakes",()=>{
  const many=Array.from({length:HR_DRIVE_CSV_CAP+2},(_,i)=>({...row,job:{...row.job,id:"job-"+i}}));
  const result=buildHrDrivesCsv(many,true);
  expect(result.exported).toBe(HR_DRIVE_CSV_CAP);
  expect(result.truncated).toBe(true);
 });
});
