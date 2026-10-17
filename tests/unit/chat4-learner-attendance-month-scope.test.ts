import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {learnerCourseAttendanceIstWindow} from "@/modules/attendance/learner-course-attendance-ist-model";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("LEARNER-home-courses-18 scoped attendance month",()=>{
 it("LEARNER-home-courses-18 computes accurate IST half-open months including year boundary",()=>{
  const jan=learnerCourseAttendanceIstWindow("2099-01");
  expect(jan?.from.toISOString()).toBe("2098-12-31T18:30:00.000Z");
  expect(jan?.to.toISOString()).toBe("2099-01-31T18:30:00.000Z");
  expect(learnerCourseAttendanceIstWindow("2099-13")).toBeNull();
  expect(learnerCourseAttendanceIstWindow("2099-01-01")).toBeNull();
 });
 it("LEARNER-home-courses-18 filters persisted attendance by authorized delivery and date at SQL boundary",()=>{
  const service=source("src/modules/attendance/learner-service.ts");
  const page=source("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx");
  const view=source("src/components/courses/learner-course-attendance.tsx");
  expect(service).toContain("authorizedDeliveries=options.deliveryId");
  expect(service).toContain('throw new AuthorizationError("courses.read")');
  expect(service).toContain("options.window.from");
  expect(service).toContain("options.window.to");
  expect(page).toContain("{ includeHistorical: true,deliveryId,window }");
  expect(page).toContain("key={selectedMonth}");
  expect(view).toContain('params.set("month",monthKey(next))');
  expect(view).toContain("router.replace(pathname");
  expect(view).not.toContain("setMonth(");
 });
});
