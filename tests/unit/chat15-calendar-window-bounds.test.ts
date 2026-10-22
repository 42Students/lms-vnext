import {describe,expect,it} from "vitest";
import {learnerCalendarVisibleWindow} from "@/modules/academics/learner-calendar-window-model";
import {readFileSync} from "node:fs";
import {learnerAttendanceMonthWindow} from "@/modules/attendance/learner-attendance-calendar-model";
import {join} from "node:path";
describe("chat-15 bounded calendar retrieval",()=>{
 it("LEARNER-learning-misc-34 bounds academic schedule to IST visible month and week spillover",()=>{
  // May 2099 is supported; malformed months still fail before schedule reads.
  expect(()=>learnerCalendarVisibleWindow("2099-13",new Date("2099-05-15T00:00:00Z"))).toThrow("INVALID_CALENDAR_MONTH");
  const window=learnerCalendarVisibleWindow("2099-05",new Date("2099-05-15T00:00:00Z"));
  expect(window.from.toISOString()).toBe("2099-04-25T18:30:00.000Z");
  expect(window.to.toISOString()).toBe("2099-06-06T18:30:00.000Z");
  expect(window.to.getTime()-window.from.getTime()).toBe(42*86_400_000);
  const src=readFileSync(join(process.cwd(),"src/modules/academics/learner-schedule-service.ts"),"utf8");
  expect(src).toContain("lt(sectionScheduleEvents.startsAt,visibleWindow.to)");
  expect(src).toContain("gt(sectionScheduleEvents.endsAt,visibleWindow.from)");
  expect(readFileSync(join(process.cwd(),"src/app/(authenticated)/learn/calendar/page.tsx"),"utf8")).toMatch(/getLearnerClassSchedule\(context,\s*window\)/);
 });
 it("LEARNER-learning-misc-34 bounds attendance calendar and detail reads to IST month",()=>{
  const may=learnerAttendanceMonthWindow("2099-05");
  expect(may.from.toISOString()).toBe("2099-04-30T18:30:00.000Z");
  expect(may.to.toISOString()).toBe("2099-05-31T18:30:00.000Z");
  const service=readFileSync(join(process.cwd(),"src/modules/attendance/learner-service.ts"),"utf8");
  expect(service).toContain("lt(sectionScheduleEvents.startsAt, options.window.to)");
  const attendance=readFileSync(join(process.cwd(),"src/app/(authenticated)/learn/attendance/page.tsx"),"utf8");
  expect(attendance).toContain("window:learnerAttendanceMonthWindow(selected)");
  const calendar=readFileSync(join(process.cwd(),"src/modules/attendance/learner-attendance-calendar-service.ts"),"utf8");
  expect(calendar).toContain("window: learnerAttendanceMonthWindow(query.month)");
 });
});
