import {describe,expect,it,afterEach} from "vitest";
import {parseCollegeIstLocal} from "@/modules/courses/college-ist-datetime-model";
import {resourceMaterialsRuntimeEnabled} from "@/modules/courses/resource-material-readiness";
import {collegeAssessmentExportHref,collegeAssessmentExportQuerySchema,renderCollegeAssessmentCsv,COLLEGE_ASSESSMENT_EXPORT_CAP} from "@/modules/courses/college-assessment-export-model";
import {collegeCourseCatalogueExportHref,renderCollegeCourseCatalogueCsv} from "@/modules/courses/college-course-catalogue-export-model";
import {collegeAssessmentListQuerySchema} from "@/modules/courses/college-assessment-aggregate-model";

describe("chat-7 weak export boundaries: calendar exactness, rollout flags, scoped CSV and formula safety",()=>{
 const previous=process.env.DB05_RESOURCE_MATERIALS_READY;
 afterEach(()=>{if(previous===undefined)delete process.env.DB05_RESOURCE_MATERIALS_READY;
   else process.env.DB05_RESOURCE_MATERIALS_READY=previous;});
 it("COURSES-WEAK-IST-01 parses midnight, leap day, and end-of-day into exact IST instants",()=>{
  expect(parseCollegeIstLocal("2028-02-29T00:00")).toBe("2028-02-28T18:30:00.000Z");
  expect(parseCollegeIstLocal("2028-02-29T23:59")).toBe("2028-02-29T18:29:00.000Z");
  expect(parseCollegeIstLocal("2026-10-18T10:05")).toBe("2026-10-18T04:35:00.000Z");
 });
 it("COURSES-WEAK-IST-02 rejects impossible dates, out-of-bounds time, extra timezone or malformed input rather than normalize",()=>{
  for(const bad of ["2026-02-29T10:00","2028-02-30T10:00","2026-04-31T00:00",
    "2026-00-10T00:00","2026-13-10T00:00","2026-01-01T24:00",
    "2026-01-01T23:60","1999-12-31T00:00","2026-01-01T00:00Z",
    "2026-01-01","2026-01-01 10:05","","2026-1-1T00:00"]){
   expect(parseCollegeIstLocal(bad)).toBeNull();
  }
 });
 it("COURSES-WEAK-DB05-03 only enables materials on verified exact runtime flag",()=>{
  for(const v of [undefined,"","true","DB05_STAGED","db05_verified"]){
   if(v===undefined)delete process.env.DB05_RESOURCE_MATERIALS_READY;
   else process.env.DB05_RESOURCE_MATERIALS_READY=v;
   expect(resourceMaterialsRuntimeEnabled()).toBe(false);
  }
  process.env.DB05_RESOURCE_MATERIALS_READY="DB05_VERIFIED";
  expect(resourceMaterialsRuntimeEnabled()).toBe(true);
 });
 it("COURSES-WEAK-EXPORT-04 keeps export URL inside college assessment endpoint without untrusted page/extra keys",()=>{
  const query=collegeAssessmentListQuerySchema.parse({q:"x & y",courseCode:"CS101",status:"PUBLISHED",page:9,results:"PUBLISHED"});
  const url=collegeAssessmentExportHref("QUIZ",query);
  expect(url.startsWith("/api/academics/college-assessment-export/quiz?")).toBe(true);
  const params=new URL(url,"https://local.invalid").searchParams;
  expect(params.get("q")).toBe("x & y");
  expect(params.get("courseCode")).toBe("CS101");
  expect(params.get("page")).toBeNull();
  expect(params.get("results")).toBe("PUBLISHED");
  const assignment=collegeAssessmentExportHref("ASSIGNMENT",query);
  expect(assignment.startsWith("/api/academics/college-assessment-export/assignment?")).toBe(true);
  expect(new URL(assignment,"https://local.invalid").searchParams.get("results")).toBeNull();
  expect(collegeAssessmentExportQuerySchema.safeParse({exportMode:"PAGE",page:1}).success).toBe(true);
  expect(collegeAssessmentExportQuerySchema.safeParse({exportMode:"PAGE",page:0}).success).toBe(false);
  expect(collegeAssessmentExportQuerySchema.safeParse({q:"",bad:"foreign-tenant"}).success).toBe(false);
 });
 it("COURSES-WEAK-EXPORT-05 quotes spreadsheet injection and CRLF-bearing assessment values and preserves withheld quiz results",()=>{
  const row={id:"id",title:'=HYPERLINK("https://evil", "run")',courseName:"+cmd",courseCode:"C,01",
   lessonName:"line\nsecond",offeringId:"o",status:"CLOSED",dueAt:new Date("2026-10-18T04:35:00Z"),
   deliverySpecific:true,deliveryId:null,points:10,activityCount:1,eligibleLearners:2,
   submittedLearners:1,gradedLearners:0,resultsPublished:false,resultsReleaseReady:false};
  const result=renderCollegeAssessmentCsv("QUIZ",[row],true);
  expect(result.startsWith("\ufeff")).toBe(true);
  expect(result).toContain("EXPORT TRUNCATED");
  expect(result).toContain(String(COLLEGE_ASSESSMENT_EXPORT_CAP));
  expect(result).toContain("Withheld");
  expect(result).toContain("2026-10-18T04:35:00.000Z");
  expect(result).not.toContain("\n=HYPERLINK");
  expect(result).not.toContain(",+cmd,");
  expect(result).toContain('C,01');
 });
 it("COURSES-WEAK-EXPORT-06 course list CSV safely handles formula-bearing names and filtering without page leakage",()=>{
  const csv=renderCollegeCourseCatalogueCsv([{name:"=2+3",code:"CS,01",
   departmentName:"Engineering",description:"A\nB",status:"ACTIVE"}],false);
  expect(csv).not.toContain("\n=2+3,");
  expect(csv).toContain("CS,01");
  const url=collegeCourseCatalogueExportHref({q:"sec",sort:"NAME_ASC",page:9,pageSize:"25"});
  expect(url).toBe("/api/academics/college-course-export?q=sec");
 });
});
