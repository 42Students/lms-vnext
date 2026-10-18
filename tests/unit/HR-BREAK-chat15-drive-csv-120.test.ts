import {describe,expect,it} from "vitest";
import {buildHrDrivesCsv,HR_DRIVE_CSV_CAP}
 from "@/modules/placements/hr-drives-csv-model";
import type {RecruiterDriveListItem} from "@/modules/placements/recruiter-drive-list-model";
const row=(id:string,deadline:Date|null=new Date("2099-01-01T18:30:00Z")):RecruiterDriveListItem=>({
 collegeId:"college",job:{id,title:"Engineering drive",status:"PUBLISHED",archivedAt:null,
  applicationDeadline:deadline,employmentType:"FULL_TIME",workMode:"HYBRID"},
});
describe("HR-DRIVES-CSV-120 employer job list resilience",()=>{
 it("renders corrupt historical deadlines as unavailable instead of aborting CSV",()=>{
  const result=buildHrDrivesCsv([row("job",new Date(Number.NaN))],false);
  expect(result.exported).toBe(1);
  expect(result.csv).toContain("Date unavailable");
  expect(result.csv).not.toContain("Invalid Date");
 });
 it("preserves empty deadline cells for deliberately undated jobs",()=>{
  const csv=buildHrDrivesCsv([row("job",null)],false).csv;
  expect(csv).toContain('"HYBRID",""');
 });
 it("writes only 200 authorized rows and reports truncation",()=>{
  const rows=Array.from({length:HR_DRIVE_CSV_CAP+1},(_,i)=>row("job-"+i));
  const result=buildHrDrivesCsv(rows,false);
  expect(result.exported).toBe(HR_DRIVE_CSV_CAP);
  expect(result.truncated).toBe(true);
  expect(result.csv).toContain("Additional authorized drives omitted");
 });
 it("does not export role-title spreadsheet expressions as executable formulas",()=>{
  const rows=[{...row("job"),job:{...row("job").job,title:" =HYPERLINK(1,2)"}}];
  const result=buildHrDrivesCsv(rows,false);
  expect(result.csv).toContain("' =HYPERLINK");
  expect(result.csv).not.toContain("learner@example.test");
 });
});