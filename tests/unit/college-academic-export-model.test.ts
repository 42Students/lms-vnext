import {describe,it,expect} from "vitest";
import {academicExportHref,semesterCsvSchema,batchCsvSchema,renderSemesterCsv,renderBatchCsv,exportParams}
 from "@/modules/academics/college-academic-export-model";
describe("college semester CSV",()=>{
 it("never accepts arbitrary college/page and rejects duplicate query keys",()=>{
  expect(semesterCsvSchema.safeParse({collegeId:"forged"}).success).toBe(false);
  expect(semesterCsvSchema.safeParse({page:2}).success).toBe(false);
  expect(exportParams(new URLSearchParams("q=a&q=b"))).toBeNull();
  expect(new URL(academicExportHref("SEMESTERS",{q:"a & b",status:"ALL",termNumber:2}),"https://example.test").searchParams.get("q")).toBe("a & b");
 });
 it("escapes formula cells and discloses truncation",()=>{
  const csv=renderSemesterCsv([{name:"=HYPERLINK(1)",termNumber:2,programName:"Prog, \"X\"",programCode:"+bad",totalCredits:null,isActive:true,mappedCourses:0}],true);
  expect(csv.startsWith("\ufeff")).toBe(true);
  expect(csv).toContain("\"'=HYPERLINK(1)\"");
  expect(csv).toContain("\"'+bad\"");
  expect(csv).toContain("EXPORT TRUNCATED");
 });
 it("exports bounded saved batch progression and neutralizes spreadsheet formulas",()=>{
  expect(batchCsvSchema.safeParse({page:2}).success).toBe(false);
  expect(batchCsvSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  const csv=renderBatchCsv([{id:"11111111-1111-4111-8111-111111111111",programId:"22222222-2222-4222-8222-222222222222",
   name:"=batch",code:"+code",status:"ACTIVE",programName:"P",programCode:"P",
   academicYear:null,startDate:null,endDate:null,
   currentTermNumber:null,currentAcademicYearStart:null,activeSections:0,activeEnrolledLearners:0}],true);
  expect(csv).toContain("\"'=batch\"");
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(academicExportHref("BATCHES",{q:"",status:"ACTIVE",yearStart:2026})).toContain("yearStart=2026");
 });
 it("preserves the configured-credit filter in the scoped CSV URL",()=>{
  expect(semesterCsvSchema.safeParse({creditState:"MISSING_COURSE"}).success).toBe(false);
  expect(academicExportHref("SEMESTERS",{q:"",status:"ALL",creditState:"UNSET"})).toContain("creditState=UNSET");
 });

 it("programStatus is preserved in semesters CSV",()=>{
  expect(semesterCsvSchema.safeParse({programStatus:"INVALID"}).success).toBe(false);
  expect(academicExportHref("SEMESTERS",{q:"",status:"ALL",programStatus:"ACTIVE"})).toContain("programStatus=ACTIVE");
 });

 it("mappingState: export uses the same validated filter",()=>{
  expect(semesterCsvSchema.safeParse({mappingState:"INVALID"}).success).toBe(false);
  expect(academicExportHref("SEMESTERS",{q:"",status:"ALL",mappingState:"MAPPED"})).toContain("mappingState=MAPPED");
 });

 it("expectedEndState: export uses the same validated filter",()=>{
  expect(batchCsvSchema.safeParse({expectedEndState:"INVALID"}).success).toBe(false);
  expect(academicExportHref("BATCHES",{q:"",status:"ALL",expectedEndState:"UNSET"})).toContain("expectedEndState=UNSET");
 });

 it("academicYearState: export uses the same validated filter",()=>{
  expect(batchCsvSchema.safeParse({academicYearState:"INVALID"}).success).toBe(false);
  expect(academicExportHref("BATCHES",{q:"",status:"ALL",academicYearState:"RECORDED"})).toContain("academicYearState=RECORDED");
 });

 it("retains batch parent program lifecycle for CSV",()=>{
  expect(batchCsvSchema.safeParse({programStatus:"CLOSED"}).success).toBe(false);
  expect(academicExportHref("BATCHES",{q:"",status:"ALL",programStatus:"ACTIVE"})).toContain("programStatus=ACTIVE");
 });

 it("startOnOrAfter is included in batch CSV and rejects malformed dates",()=>{
   expect(batchCsvSchema.safeParse({startOnOrAfter:"2026-13-01"}).success).toBe(false);
   expect(academicExportHref("BATCHES",{q:"",status:"ALL",startOnOrAfter:"2026-07-01"})).toContain("startOnOrAfter=2026-07-01");
 });

 it("startOnOrBefore is included in CSV and rejects malformed dates",()=>{
  expect(batchCsvSchema.safeParse({startOnOrBefore:"2026-13-01"}).success).toBe(false);
  expect(academicExportHref("BATCHES",{q:"",status:"ALL",startOnOrBefore:"2026-07-01"})).toContain("startOnOrBefore=2026-07-01");
 });

 it("activeClassState stays constrained in batch CSV",()=>{
   expect(batchCsvSchema.safeParse({activeClassState:"INFERRED"}).success).toBe(false);
   expect(academicExportHref("BATCHES",{q:"",status:"ALL",activeClassState:"NONE_ACTIVE"})).toContain("activeClassState=NONE_ACTIVE");
 });

 it("activeLearnerState stays constrained in batch CSV",()=>{
   expect(batchCsvSchema.safeParse({activeLearnerState:"INFERRED"}).success).toBe(false);
   expect(academicExportHref("BATCHES",{q:"",status:"ALL",activeLearnerState:"NONE_ACTIVE"})).toContain("activeLearnerState=NONE_ACTIVE");
 });

 it("rejects batch start-date order in matching batch CSV",()=>{
  expect(batchCsvSchema.safeParse({startOnOrAfter:"2026-09-10",startOnOrBefore:"2026-09-09"}).success).toBe(false);
  expect(batchCsvSchema.safeParse({startOnOrAfter:"2026-09-09",startOnOrBefore:"2026-09-10"}).success).toBe(true);
 });
 it("rejects missing progression versus recorded term in matching batch CSV",()=>{
  expect(batchCsvSchema.safeParse({progression:"MISSING",currentTerm:2}).success).toBe(false);
  expect(batchCsvSchema.safeParse({progression:"RECORDED",currentTerm:2}).success).toBe(true);
 });
 it("rejects unrecorded academic year versus year filter in matching batch CSV",()=>{
  expect(batchCsvSchema.safeParse({academicYearState:"UNRECORDED",yearStart:2026}).success).toBe(false);
  expect(batchCsvSchema.safeParse({academicYearState:"RECORDED",yearStart:2026}).success).toBe(true);
 });
 it("rejects missing progression versus academic year filter in matching batch CSV",()=>{
  expect(batchCsvSchema.safeParse({progression:"MISSING",yearStart:2026}).success).toBe(false);
  expect(batchCsvSchema.safeParse({progression:"RECORDED",yearStart:2026}).success).toBe(true);
 });
 it("enforces the same missing-credit constraints for semester CSV",()=>{
  expect(semesterCsvSchema.safeParse({creditState:"UNSET",minimumCredits:10}).success).toBe(false);
  expect(semesterCsvSchema.safeParse({creditState:"UNSET",maximumCredits:10}).success).toBe(false);
  expect(semesterCsvSchema.safeParse({creditState:"UNSET"}).success).toBe(true);
 });
});
