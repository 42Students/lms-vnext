import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const pathname="src/app/(authenticated)/teacher/allAssignments/page.tsx";
describe("Faculty UX route /teacher/allAssignments",()=>{
 it("UX-teacher-allassignments-01: retains routing, access and learner-facing states",()=>{
 const source=readFileSync(join(process.cwd(),pathname),"utf8");
 expect(source).toContain("getCurrentRequestContext");
 expect(source).toContain("getFacultyAssessmentOverview(context)");
 expect(source).toContain("<RetainedFacultyAssignments");
 });
});
