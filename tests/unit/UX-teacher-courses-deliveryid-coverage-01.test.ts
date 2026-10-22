import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const pathname="src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx";
describe("Faculty UX route /teacher/courses/[deliveryId]",()=>{
 it("UX-teacher-courses-deliveryid-01: retains routing, access and learner-facing states",()=>{
 const source=readFileSync(join(process.cwd(),pathname),"utf8");
 expect(source).toContain('const href=facultyCourseTabHref(canonical,"home")');
 expect(source).toContain('redirect(href+(preserved.size?"?"+preserved.toString():""))');
 expect(source).toContain('assignments.some(item=>item.deliveryId===canonical)');
 expect(source).toContain("notFound()");
 });
});
