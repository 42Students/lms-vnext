import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {courseDisplayRuntimeEnabled} from "@/modules/courses/course-display-readiness";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 owner decisions for uncertain legacy behaviors",()=>{
 it("TPO-drives-28 keeps configured counts-as-placed independent of the fixed job employment type",()=>{
  const setting=src("src/modules/placements/tpo-job-type-write-service.ts");
  const job=src("src/modules/placements/validation.ts");
  expect(setting).toContain("countsAsPlaced");
  expect(setting).toContain("placementTpoJobTypes");
  expect(job).toContain('"FULL_TIME"');
  expect(job).toContain('"INTERNSHIP"');
  expect(job).toContain('"CONTRACT"');
  expect(job).not.toContain('"INTERNSHIP_PLUS_FULL_TIME"');
 });
 it("COL-courses-content-02 fails closed until course display migration is explicitly verified",()=>{
  const source=src("src/modules/courses/course-display-readiness.ts");
  expect(source).toContain('process.env["DB05_COURSE_DISPLAY_READY"] === "DB05_VERIFIED"');
  const service=src("src/modules/courses/course-display-service.ts");
  expect(service).toContain('if (!courseDisplayRuntimeEnabled())');
  expect(courseDisplayRuntimeEnabled()).toBe(process.env.DB05_COURSE_DISPLAY_READY==="DB05_VERIFIED");
 });
 it("COL-attendance-09 reads period endedness from recorded academic dates in IST",()=>{
  const service=src("src/modules/attendance/admin-service.ts");
  const select=src("src/components/attendance/admin-attendance-workspace.tsx");
  expect(service).toContain("academicPeriods.endDate");
  expect(service).toContain("time zone 'Asia/Kolkata'");
  expect(select).toContain('item.isPast?" · past":""');
  expect(select).toContain("academicPeriodName");
 });
});
