import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {collegePromotionQuerySchema,formatPromotionAcademicYear} from "@/modules/academics/college-batch-promotion-model";
import {academicExportHref,renderBatchCsv,renderSemesterCsv} from "@/modules/academics/college-academic-export-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("College Academic Setup open-register functional checks",()=>{
 it("COL-academic-setup-19 blocks archived departments with dependencies before mutation",()=>{
  const component=read("src/components/admin/department-actions.tsx");
  expect(component).toContain("hasDependencies");
  expect(component).toContain("disabled={pending||hasDependencies}");
  expect(component).toContain("Move or remove its programs, courses or faculty assignments, then retry.");
  expect(component).toContain("Retry archive");
 });
 it("COL-academic-setup-20 confirms abandoning a changed department draft",()=>{
  const component=read("src/components/admin/department-actions.tsx");
  expect(component).toContain('title="Discard department changes?"');
  expect(component).toContain('description={`Your edits to “${name}” will be lost.`}');
  expect(component).toContain("onClick={requestEditClose}");
  expect(component).toContain("setNextName(name)");
 });
 it("COL-academic-setup-29 rejects batch archival with linked classes or learners",()=>{
  const code=read("src/components/academics/college-cohort-management.tsx");
  expect(code).toContain('row.status!=="PLANNED"');
  expect(code).toContain("row.activeSections>0 || row.activeEnrolledLearners>0");
  expect(code).toContain("Cannot archive while ");
  expect(code).toContain("Archive this planned batch?");
 });
 it("COL-academic-setup-32 retains a section-specific schedule action and class identifier",()=>{
  const code=read("src/components/academics/college-structure-directory.tsx");
  expect(code).toContain('aria-label={"Schedule recurring sessions for "+item.name}');
  expect(code).toContain("Schedule</Link>");
  expect(code).toContain("item.id");
 });
 it.each([[2024,"2024-25"],[2029,"2029-30"],[2099,"2099-00"]])(
  "COL-academic-setup-36 formats a valid academic-year pair from %i", (start,label)=>{
   expect(formatPromotionAcademicYear(start)).toBe(label);
   expect(collegePromotionQuerySchema.parse({yearStart:label}).yearStart).toBe(start);
  });
 it("COL-academic-setup-36 refuses mismatched year suffixes",()=>{
  expect(collegePromotionQuerySchema.safeParse({yearStart:"2024-26"}).success).toBe(false);
  expect(collegePromotionQuerySchema.safeParse({yearStart:"2024-250"}).success).toBe(false);
 });
 it("COL-academic-setup-39 restricts CSV export to chosen college filters",()=>{
  const href=academicExportHref("BATCHES",{q:"A&B",status:"ACTIVE",yearStart:2024});
  const url=new URL(href,"https://example.test");
  expect(url.pathname).toBe("/api/academics/college-academic-export/batches");
  expect(url.searchParams.get("q")).toBe("A&B");
  expect(url.searchParams.get("yearStart")).toBe("2024");
  expect(url.searchParams.get("status")).toBe("ACTIVE");
 });
 it("COL-academic-setup-39 emits a real CSV rather than arbitrary HTML",()=>{
  const csv=renderSemesterCsv([{name:"Semester 1",termNumber:1,programName:"B.Tech",programCode:"CS",
    totalCredits:24,isActive:true,mappedCourses:6}],false);
  expect(csv).toContain("Semester");
  expect(csv).toContain("B.Tech");
  const batch=renderBatchCsv([{id:"11111111-1111-4111-8111-111111111111",
    name:"2024 CSE",code:"B24",status:"ACTIVE",programName:"B.Tech",programCode:"CSE",
    programId:"22222222-2222-4222-8222-222222222222",academicYear:"2024-25",
    startDate:null,endDate:null,currentTermNumber:1,currentAcademicYearStart:2024,
    activeSections:2,activeEnrolledLearners:120}],false);
  expect(batch).toContain("2024 CSE");
  expect(batch).toContain('"students"');
 });
 it("COL-academic-setup-40 surfaces retry on department initial load failure",()=>{
  const error=read("src/app/(authenticated)/college/departments/error.tsx");
  expect(error).toContain("Could not load departments");
  expect(error).toContain("Retry");
  expect(error).toContain("reset");
  expect(error).not.toContain("error.message");
 });
 it("COL-academic-setup-40 advertises loading without fabricating list rows",()=>{
  const loading=read("src/app/(authenticated)/college/departments/loading.tsx");
  expect(loading).toContain('aria-busy="true"');
  expect(loading).not.toContain("No departments found");
 });
 it.each(["=SUM(1,2)","+CMD","-1+2","@HYPERLINK","\t=CMD"])(
  "COL-academic-setup-39 neutralizes formula text in exported semester rows: %s",name=>{
   const csv=renderSemesterCsv([{name,termNumber:1,programName:"B.Tech",
    programCode:"CSE",totalCredits:null,isActive:true,mappedCourses:0}],false);
   expect(csv).toContain('"\''+name.replaceAll('"','""')+'"');
 });
 it("COL-academic-setup-39 visibly marks a truncated export instead of claiming completeness",()=>{
  const result=renderSemesterCsv([],true);
  expect(result).toContain("EXPORT TRUNCATED");
  expect(result).toContain("Narrow your filters.");
 });

 it("COL-academic-setup-29 uses same-origin guarded batch archive without exposing backend codes",()=>{
  const code=read("src/components/academics/college-cohort-management.tsx");
  expect(code).toContain('await apiFetch("/api/college/batches/"+encodeURIComponent(row.id)');
  expect(code).not.toContain('new Error(payload.error??"BATCH_REMOVAL_FAILED")');
  expect(code).toContain("expectedUpdatedAt:new Date(row.updatedAt).toISOString()");
 });
 it("COL-academic-setup-33 uses guarded graduation action without echoing provider error data",()=>{
  const code=read("src/components/academics/college-cohort-management.tsx");
  expect(code).toContain('await apiFetch("/api/college/batches/" + encodeURIComponent(row.id) + "/graduate"');
  expect(code).not.toContain('throw new Error(payload?.error ?? "Graduation failed")');
  expect(code).toContain("academicSetupErrorMessage(error,");
 });

});
