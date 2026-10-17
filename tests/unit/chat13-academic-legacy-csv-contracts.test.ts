import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Academic Setup CSV parity",()=>{
 it("SA-academics-people-46 exports role-scoped structured academic fields rather than generic directory metadata",()=>{
  const root="src/app/api/admin/";
  const semester=read(root+"semesters/export/route.ts");
  expect(semester).toContain('"id","name","semesterNumber","programId","totalCredits","isActive"');
  expect(semester).not.toContain('"program","totalCredits","courses"');
  const batch=read(root+"batches/export/route.ts");
  const classes=read(root+"classes/export/route.ts");
  const mapping=read(root+"semester-courses/export/route.ts");
  for(const source of [semester,batch,classes,mapping]){
   expect(source).toContain("getCurrentRequestContext");
   expect(source).toContain("X-Export-Truncated");
   expect(source).toContain("text/csv");
  }
  expect(batch).toContain('"academicYear","currentSemester","status","students"');
  expect(classes).toContain('"maxStudents","students","status"');
  expect(mapping).toContain('"semesterId","courseId"');
  expect(mapping).toContain("listCollegeTermMappings(context)");
 });
});
