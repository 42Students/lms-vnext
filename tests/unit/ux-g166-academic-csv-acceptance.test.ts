import { CACHE_PIN } from "../support/cache-pin";
import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {buildCollegeDirectoryCsv,collectCollegeExportRows} from "@/modules/academics/college-directory-export-model";
import {renderBatchCsv,renderSemesterCsv} from "@/modules/academics/college-academic-export-model";
import {renderCollegeClassesCsv,CLASSES_EXPORT_CAP,collegeClassesExportSchema} from "@/modules/academics/college-classes-export-model";
import {renderElectivesCsv} from "@/modules/academics/college-elective-export-model";
import {renderFacultyAssignmentCsv} from "@/modules/academics/college-faculty-assignment-export-model";
import {renderLectureHallsCsv,renderSuperAdminLectureHallsCsv} from "@/modules/academics/college-lecture-halls-export-model";
import {renderOfferingMappingCsv} from "@/modules/academics/college-mapping-export-model";

const risky = "\u093E=IMPORTDATA(1)";
const riskyEnclosing = "\u20DD@SUM(2)";
const csvRows = (csv: string) => csv.replace(/^\uFEFF/, "").split("\r\n").filter(Boolean);

describe("UX-G166 academic outbound CSV display contracts",()=>{
 it("preserves UTF-8 BOM, columns, hostile literals and consistent truncated row widths",()=>{
  const csv=buildCollegeDirectoryCsv(["Name","Status","Notes"],[[risky,riskyEnclosing,'a "quoted" name']],true,1000);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"' + "'" + risky + '"');
  expect(csv).toContain('"' + "'" + riskyEnclosing + '"');
  expect(csv).toContain('a ""quoted"" name');
  const lines=csvRows(csv);
  expect(lines).toHaveLength(3);
  for(const line of lines)expect(line.split(",")).toHaveLength(3);
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).toContain("Narrow your filters");
 });

 it("caps even a directly called CSV serializer and never silently drops extras",()=>{
  const csv=buildCollegeDirectoryCsv(["Name","Status"],[
   ["A","ACTIVE"],["B","ACTIVE"],["C","ACTIVE"],
  ],false,2);
  expect(csvRows(csv)).toHaveLength(4);
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).toContain("Only the first 2 matching records");
  expect(csv).not.toContain('"C"');
  expect(()=>buildCollegeDirectoryCsv(["Name"],[],false,0)).toThrow(RangeError);
 });

 it("protects each academic model's user-controlled display strings without dropping legacy fields",()=>{
  const csvs=[
   renderBatchCsv([{id:"batch-id",name:risky,code:"B",status:"ACTIVE",programId:"program-id",
     programName:"Math",programCode:"M",academicYear:"2026-27",startDate:null,endDate:null,
     currentTermNumber:1,currentAcademicYearStart:2026,activeSections:1,activeEnrolledLearners:12}],false),
   renderSemesterCsv([{name:risky,termNumber:1,programName:"Math",programCode:"M",
     totalCredits:24,isActive:true,mappedCourses:4}],false),
   renderCollegeClassesCsv([{id:"class-id",name:risky,linkedProgramId:null,cohortId:"batch-id",
     periodStart:null,periodEnd:null,minSize:null,capacity:20}],false),
   renderElectivesCsv([{name:risky,programName:"Math",semesterNumber:1,academicYear:2026,
     periodName:null,credits:3,minPick:1,maxPick:2,activeOfferings:1,status:"ACTIVE"}],false),
   renderFacultyAssignmentCsv([{facultyName:risky,role:"PRIMARY",courseName:"Math",courseCode:"M",
     sectionName:"A",cohortName:"Batch",periodName:"Term",state:"ACTIVE",
     startedAt:new Date("2026-11-07T05:00:00Z"),endedAt:null}],false),
   renderLectureHallsCsv([{name:risky,capacity:120,roomType:"CLASSROOM",
     status:"ACTIVE",departmentName:null,upcomingClasses:0}],false),
   renderSuperAdminLectureHallsCsv([{id:"hall-id",name:risky,capacity:120,
     roomType:"CLASSROOM",departmentId:null,description:null}],false),
   renderOfferingMappingCsv([{courseName:risky,courseCode:"C101",programName:"Math",
     cohortName:"Batch",periodName:"Term",periodCode:"T",type:"CORE",
     credits:3,status:"ACTIVE"}],false),
  ];
  expect(csvs).toHaveLength(8);
  for(const csv of csvs){
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"' + "'" + risky + '"');
    expect(csvRows(csv)).toHaveLength(2);
  }
  expect(csvs[0]).toContain('"batchName"');
  expect(csvs[4]).toContain("Started at (UTC)");
  expect(csvs[6]).toContain('"description"');
 });

 it("caps class export, visibly discloses truncation and rejects caller-authored pagination",()=>{
  expect(CLASSES_EXPORT_CAP).toBe(1000);
  expect(collegeClassesExportSchema.safeParse({page:2}).success).toBe(false);
  expect(collegeClassesExportSchema.safeParse({pageSize:100}).success).toBe(false);
  expect(collegeClassesExportSchema.safeParse({collegeId:"external"}).success).toBe(false);
  const row={id:"id",name:"Section",linkedProgramId:null,cohortId:"batch",
    periodStart:null,periodEnd:null,minSize:null,capacity:20};
  const csv=renderCollegeClassesCsv(Array.from({length:1001},(_,i)=>({...row,id:"id-"+i})),false);
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).not.toContain('"id-1000"');
  expect(csvRows(csv)).toHaveLength(1002);
 });
});

describe("UX-G166 export freshness and pager behavior",()=>{
 it("walks scoped pages to the cap and fails closed on changing totals",async()=>{
  const rows=await collectCollegeExportRows(async page=>({
    total:4,totalPages:2,items:[{id:"id-"+(page*2-1)},{id:"id-"+page*2}],
  }),2,4);
  expect(rows.rows).toHaveLength(4);
  expect(rows.truncated).toBe(false);
  await expect(collectCollegeExportRows(async page=>({
    total:page===1?4:5,totalPages:2,
    items:[{id:"id-"+page},{id:"id-"+(page+2)}],
  }),2,4)).rejects.toThrow("COLLEGE_EXPORT_STALE");
 });

 it("rejects missing, duplicated or oversized page responses without silent incomplete exports",async()=>{
  await expect(collectCollegeExportRows(async page=>({
    total:4,totalPages:2,items:page===1?[{id:"a"},{id:"b"}]:[{id:"c"}],
  }),2,4)).rejects.toThrow("COLLEGE_EXPORT_STALE");
  await expect(collectCollegeExportRows(async page=>({
    total:4,totalPages:2,items:page===1?[{id:"a"},{id:"b"}]:[{id:"a"},{id:"d"}],
  }),2,4)).rejects.toThrow("COLLEGE_EXPORT_STALE");
  await expect(collectCollegeExportRows(async()=>({
    total:1,totalPages:1,items:[{id:"a"},{id:"b"}],
  }),1,4)).rejects.toThrow("COLLEGE_EXPORT_STALE");
 });

 it("rejects impossible totals and impossible page counts before serving a CSV",async()=>{
  await expect(collectCollegeExportRows(async()=>({
    total:4,totalPages:1,items:[{id:"a"},{id:"b"}],
  }),2,4)).rejects.toThrow("COLLEGE_EXPORT_STALE");
  await expect(collectCollegeExportRows(async()=>({
    total:-1,totalPages:1,items:[],
  }),2,4)).rejects.toThrow("COLLEGE_EXPORT_STALE");
 });
});

describe("UX-G166 route and fixture boundaries",()=>{
 it("keeps authenticated, step-up-protected CSV routes private and non-sniffable",()=>{
  const routes=[
   "src/app/api/academics/college-academic-export/batches/route.ts",
   "src/app/api/academics/college-academic-export/semesters/route.ts",
   "src/app/api/academics/college-classes-export/route.ts",
   "src/app/api/academics/college-electives-export/route.ts",
   "src/app/api/academics/college-faculty-assignment-export/route.ts",
   "src/app/api/academics/college-lecture-halls-export/route.ts",
   "src/app/api/academics/college-offering-mappings-export/route.ts",
  ];
  for(const path of routes){
   const source=readFileSync(path,"utf8");
   expect(source).toContain('auth: "user"');
   expect(source).toContain("stepUp: true");
   expect(source).toMatch(CACHE_PIN);
   expect(source).toContain("nosniff");
   expect(source).toContain("text/csv; charset=utf-8");
  }
 });

 it("denies synthetic export browser fixture outside development",()=>{
  const fixture=readFileSync("src/app/e2e/ux-g166-academic-csv/page.tsx","utf8");
  expect(fixture).toContain('process.env.NODE_ENV!=="development"');
  expect(fixture).toContain('env.UX_G166_FIXTURE!=="1"');
  expect(fixture).toContain("notFound()");
  expect(fixture).not.toContain("getCurrentRequestContext");
  expect(fixture).not.toContain("getDb()");
 });
});
