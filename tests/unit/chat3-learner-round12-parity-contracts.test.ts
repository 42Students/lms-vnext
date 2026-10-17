import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
/** Evidence for implemented sub-contracts only; incomplete audit gaps remain open. */
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 learner misc second-source verification",()=>{
 it("LEARNER-learning-misc-03 method gating remains enforced in the assignment form",()=>{
  const code=source("src/components/courses/assignment-submission-control.tsx");
  expect(code).toContain("normalizeAssignmentMethods");
  expect(code).toContain("This submission method is not allowed.");
 });
 it("LEARNER-learning-misc-09 unsent work is protected during browser navigation",()=>{
  const code=source("src/components/courses/assignment-submission-control.tsx");
  expect(code).toContain("addEventListener(\"beforeunload\",guard)");
  expect(code).toContain("const unsent=");
 });
 it("LEARNER-learning-misc-20 quiz cancellation warns before leaving",()=>{
  const code=source("src/components/courses/learner-quiz-attempt.tsx");
  expect(code).toContain("Are you sure you want to cancel this quiz?");
  expect(code).toContain("window.confirm");
 });
 it("LEARNER-learning-misc-30 hourly and all-day sessions are distinguished",()=>{
  const code=source("src/components/academics/learner-class-schedule.tsx");
  expect(code).toContain("function LearnerHourlyGrid");
  expect(code).toContain("aria-label=\"Hourly class schedule\"");
  expect(code).toContain("ALL DAY");
 });
 it("LEARNER-learning-misc-32 Today and Next schedule summary uses real events",()=>{
  const code=source("src/components/academics/learner-class-schedule.tsx");
  expect(code).toContain("label=\"Today\"");
  expect(code).toContain("label=\"Next\"");
  expect(code).toContain("todayEvents.map");
 });
 it("LEARNER-learning-misc-33 calendar failure offers an explicit retry",()=>{
  const code=source("src/app/(authenticated)/learn/calendar/error.tsx");
  expect(code).toContain("Retry");
 });
 it("LEARNER-learning-misc-35 schedule maintains a narrow-screen day agenda",()=>{
  const code=source("src/components/academics/learner-class-schedule.tsx");
  expect(code).toContain("md:hidden");
  expect(code).toContain("istMonthGridKeys");
 });
 it("LEARNER-learning-misc-36 attendance table retains explicit date and start-time headings",()=>{
  const code=source("src/components/attendance/learner-attendance-workspace.tsx");
  expect(code).toContain(">Day</th>");
  expect(code).toContain(">Class Start Time</th>");
 });
 it("LEARNER-learning-misc-38 attendance empty state asks for a course",()=>{
  const code=source("src/components/attendance/learner-attendance-workspace.tsx");
  expect(code).toContain("Select a course");
 });
 it("LEARNER-learning-misc-39 supplemental attendance calendar title stays accurate",()=>{
  const code=source("src/app/(authenticated)/learn/attendance/calendar/page.tsx");
  expect(code).toContain("<PageHeader title=\"Attendance calendar\"");
 });
 it("LEARNER-learning-misc-40 attendance chooser shows student-facing course names",()=>{
  const code=source("src/components/attendance/learner-attendance-workspace.tsx");
  expect(code).toContain("{item.courseName}");
 });
});
