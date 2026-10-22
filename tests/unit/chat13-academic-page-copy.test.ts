import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const base="src/app/(authenticated)/admin/";
describe("Super Admin Academic Setup page copy",()=>{
 it("SA-academics-people-02 shows the legacy no-college guidance without exposing the six-step strip",()=>{
  const guidance:Record<string,readonly string[]>={
   batches:["Select a college to manage Batches","Batches belong to a specific college"],
   classes:["Select a college to continue.","Choose a college in the header above to see its classes"],
   "semester-courses":["Select a college to manage Semester–Course Mapping","Choose an Organization + College"],
   electives:["Select a college from the header","Choose a college in the header above to see its electives"],
   attendance:["Select a college to continue","Choose a college in the header above to see its attendance"],
  };
  for(const [path,expected] of Object.entries(guidance)){
   const code=read(base+path+"/page.tsx");
   for(const phrase of expected)expect(code).toContain(phrase);
  }
  // Batch-promotion is guarded via the shared scoped component, rather than
  // rendering the old no-college text in its route wrapper.
  expect(read(base+"batch-promotion/page.tsx")).toContain("BatchPromotion");
  for(const path of ["departments","programs"]){
   const code=read(base+path+"/page.tsx");
   expect(code).not.toContain("      <AcademicSetupSteps step={1} />\n        <PageHeader");
   expect(code).not.toContain("      <AcademicSetupSteps step={2} />\n        <PageHeader");
  }
  expect(read(base+"batches/page.tsx")).toContain("data ? <AcademicSetupSteps");
  expect(read(base+"classes/page.tsx")).toContain("data ? <AcademicSetupSteps");
 });
 it("SA-academics-people-03 omits Super Admin eyebrows on legacy Academic Setup pages",()=>{
  for(const path of ["departments","programs","semesters","batch-promotion","electives","attendance","lecture-halls"]){
   const code=read(base+path+"/page.tsx");
   expect(code).not.toContain('eyebrow="Super Admin');
  }
 });
 it("SA-academics-people-04 matches the legacy academic navigation titles",()=>{
  expect(read(base+"batch-promotion/page.tsx")).not.toContain('title="Batch Promotion Preview"');
  expect(read(base+"electives/page.tsx")).toContain('title="Electives"');
  expect(read(base+"semester-courses/page.tsx")).toContain('title="Semester–Course Mapping"');
 });
});
