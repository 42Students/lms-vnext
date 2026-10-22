import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("FAC-attendance-grades-22 header-copy parity",()=>{
 it("FAC-attendance-grades-22 does not invent legacy Faculty eyebrow or a dynamic report header description",()=>{
  for(const tab of ["gradebook","reports","session-coverage"]){
   const file=read("src/app/(authenticated)/teacher/courses/[deliveryId]/"+tab+"/page.tsx");
   expect(file).toContain("<PageHeader title=");
   expect(file).not.toContain('eyebrow="Faculty');
   // Static recovery descriptions and valid scoped counts are useful.
   expect(file).not.toContain('description={data.delivery.courseName');
   expect(file).not.toContain('description={data.delivery.courseName');
   expect(file).not.toContain('description={data.course.courseName');
  }
 });
 it("FAC-attendance-grades-22 preserves authorized read APIs, actions and meaningful states",()=>{
  const gradebook=read("src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx");
  const reports=read("src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx");
  const coverage=read("src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx");
  expect(gradebook).toContain("getFacultyPublishedGradebook(context,parsed.data)");
  expect(gradebook).toContain("Download full section CSV");
  expect(reports).toContain("getFacultyReportsHub(");
  expect(reports).toContain("Open gradebook");
  expect(coverage).toContain("getFacultySessionCoverage(");
  expect(coverage).toContain("Unmarked sessions are not counted as absent learner records.");
 });
});
