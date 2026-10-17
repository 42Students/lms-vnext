import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const base="src/app/(authenticated)/admin/";
describe("Super Admin Academic Setup page copy",()=>{
 it("SA-academics-people-02 shows the legacy no-college guidance without exposing the six-step strip",()=>{
  for(const path of ["batches","classes","semester-courses","batch-promotion","electives","attendance"]){
   const code=read(base+path+"/page.tsx");
   expect(code).toContain("Select a college to continue");
   expect(code).toContain("Choose a college in the header above to see its");
  }
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
