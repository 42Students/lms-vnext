import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const pathname="src/app/(authenticated)/teacher/courses/page.tsx";
describe("Faculty UX route /teacher/courses",()=>{
 it("UX-teacher-courses-01: retains routing, access and learner-facing states",()=>{
 const source=readFileSync(join(process.cwd(),pathname),"utf8");
 expect(source).toContain("getCurrentRequestContext");
 expect(source).toContain("PageHeader title=\"My Courses\"");
 expect(source).toContain('<Alert tone="error"');
 expect(source).toContain('<ErrorState title="Failed to load courses. Please try again."');
 });
});
