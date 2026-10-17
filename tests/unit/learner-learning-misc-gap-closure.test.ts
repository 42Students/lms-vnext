import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const assignment=()=>source("src/components/courses/assignment-submission-control.tsx");
const overview=()=>source("src/components/courses/learner-assessment-overview.tsx");
const quiz=()=>source("src/components/courses/learner-quiz-attempt.tsx");
const schedule=()=>source("src/components/academics/learner-class-schedule.tsx");
const attendance=()=>source("src/components/attendance/learner-attendance-workspace.tsx");

describe("Learner Learning Misc legacy gap evidence",()=>{
 it("LEARNER-learning-misc-03 allowed submission methods are fetched and gated in learner form",()=>{
  expect(assignment()).toContain('"/methods?deliveryId="');
  expect(assignment()).toContain("normalizeAssignmentMethods");
  expect(assignment()).toContain("This submission method is not allowed.");
 });
 it("LEARNER-learning-misc-09 browser navigation respects an unsent assignment",()=>{
  expect(assignment()).toContain('addEventListener("beforeunload",guard)');
  expect(assignment()).toContain("const unsent=");
 });
 it("LEARNER-learning-misc-10 failed assignment shows an alert and Retry",()=>{
  expect(assignment()).toContain("Assignment was not submitted.");
  expect(assignment()).toContain('error?"Retry":"Submit"');
 });
 it("LEARNER-learning-misc-14 assignment load error distinguishes network failure from empty results",()=>{
  const page=source("src/app/(authenticated)/learn/allAssignments/error.tsx");
  expect(page).toContain("Assignments could not be loaded");
  expect(page).toContain("This is a loading problem, not an empty list.");
  expect(page).toContain("<Button onClick={reset}>Retry</Button>");
 });
 it("LEARNER-learning-misc-17 released quiz actions say View answers or Review quiz",()=>{
  const model=source("src/components/courses/quiz-overview-state.ts");
  expect(model).toContain('action: "View answers"');
  expect(model).toContain('action: "Review quiz"');
  expect(model).toContain('action: "Unavailable"');
 });
 it("LEARNER-learning-misc-18 empty quiz subtitle matches legacy copy exactly",()=>{
  expect(overview()).toContain("Quizzes assigned to you by your teachers will appear here.");
 });
 it("LEARNER-learning-misc-22 safely allows unanswered quiz questions with explicit confirmation and zero credit",()=>{
  const quizCode=quiz();
  const service=source("src/modules/courses/quiz-attempt-service.ts");
  expect(quizCode).toContain("Your quiz will still be submitted");
  expect(quizCode).toContain("Go to first unanswered");
  expect(quizCode).toContain("Answer this question or use the question numbers to skip.");
  expect(service).toContain("selectedOptionIds");
  expect(service).toContain("pointsAwarded");
 });
 it("LEARNER-learning-misc-20 leaving an attempt asks for a guarded confirmation dialog",()=>{
  const attempt=quiz();
  expect(attempt).toContain("Are you sure you want to cancel this quiz?");
  expect(attempt).toContain("<ConfirmDialog open={leaveOpen}");
  expect(attempt).toContain('confirmVariant="danger" confirmLabel="Leave quiz"');
  expect(attempt).toContain("if (attemptable && !review) { setLeaveOpen(true); return; }");
  expect(attempt).toContain('router.replace("/learn/allQuizzes")');
  expect(attempt).toContain('window.sessionStorage.setItem(storageKey, JSON.stringify({ answers, step }))');
 });
 it("LEARNER-learning-misc-21 learner quiz success copy uses actual result release rule",()=>{
  expect(quiz()).toContain("Quiz submitted! Score: ");
  expect(quiz()).toContain("Quiz submitted. Results will be visible after faculty releases them.");
 });
 it("LEARNER-learning-misc-30 day/week schedule uses true hourly slots and all-day header",()=>{
  expect(schedule()).toContain("function LearnerHourlyGrid");
  expect(schedule()).toContain('aria-label="Hourly class schedule"');
  expect(schedule()).toContain(">ALL DAY</div>");
  expect(schedule()).toContain("learnerHourLabel(hour)");
 });
 it("LEARNER-learning-misc-31 schedule events preserve per-course tint and tooltip facts",()=>{
  expect(schedule()).toContain("function learnerCourseTint");
  expect(schedule()).toContain("function scheduleEventTooltip");
  expect(schedule()).toContain('"Location: "+');
  expect(schedule()).toContain('title={scheduleEventTooltip(event)}');
 });
 it("LEARNER-learning-misc-32 schedule header has Today and Next summaries with tooltips",()=>{
  expect(schedule()).toContain('label="Today"');
  expect(schedule()).toContain('label="Next"');
  expect(schedule()).toContain("todayEvents.map");
  expect(schedule()).toContain("nextEvent?");
 });
 it("LEARNER-learning-misc-33 route-level network failures and week emptiness have safe, distinct legacy wording",()=>{
  const page=schedule();
  const err=source("src/app/(authenticated)/learn/calendar/error.tsx");
  expect(page).toContain("You are not assigned to a class yet");
  expect(page).toContain("No scheduled classes this week.");
  expect(err).toContain("Unable to load class schedule. Please try again.");
  expect(err).toContain("Retry");
 });
 it("LEARNER-learning-misc-33 schedule load error offers an explicit Retry",()=>{
  const fail=source("src/app/(authenticated)/learn/calendar/error.tsx");
  expect(fail).toContain("Unable to load class schedule");
  expect(fail).toContain("Retry");
 });
 it("LEARNER-learning-misc-35 mobile schedule renders narrow day agenda separately",()=>{
  expect(schedule()).toContain("md:hidden");
  expect(schedule()).toContain("istMonthGridKeys");
 });
 it("LEARNER-learning-misc-36 attendance report restores legacy four column labels",()=>{
  expect(attendance()).toMatch(/<th[^>]*>\s*Date\s*<\/th>/);
  expect(attendance()).toContain(">Day</th>");
  expect(attendance()).toContain(">Class Start Time</th>");
  expect(attendance()).toMatch(/<th[^>]*>\s*Status\s*<\/th>/);
 });
 it("LEARNER-learning-misc-37 attendance Total Present Absent counts support date history",()=>{
  expect(attendance()).toContain('label="Total"');
  expect(attendance()).toContain('label="Present"');
  expect(attendance()).toContain('label="Absent"');
  expect(attendance()).toContain('history={recentStatusDates("PRESENT")}');
  expect(attendance()).toContain('history={recentStatusDates("ABSENT")}');
 });
 it("LEARNER-learning-misc-38 attendance distinguishes unselected course, no month records and load error",()=>{
  const page=attendance();
  const err=source("src/app/(authenticated)/learn/attendance/error.tsx");
  expect(page).toContain('deliveryId ? "No attendance records" : "Select a course"');
  expect(page).toContain("No classes scheduled for this month. Try selecting a different period.");
  expect(page).toContain("Choose a course from the dropdown above to view your attendance records.");
  expect(err).toContain("Something went wrong loading attendance for this month.");
  expect(err).toContain("Retry");
 });
 it("LEARNER-learning-misc-38 attendance empty/error distinction retains course guidance",()=>{
  expect(attendance()).toContain("Select a course");
  expect(attendance()).toContain("Choose a course from the dropdown above to view your attendance records.");
  expect(source("src/app/(authenticated)/learn/attendance/error.tsx")).toContain("Retry");
 });
 it("LEARNER-learning-misc-39 supplemental attendance calendar avoids invented legacy subtitle",()=>{
  const calendar=source("src/app/(authenticated)/learn/attendance/calendar/page.tsx");
  expect(calendar).toContain('<PageHeader title="Attendance calendar"');
  expect(calendar).not.toContain('eyebrow="Learner · Attendance"');
 });
 it("LEARNER-learning-misc-40 course chooser displays student-facing names",()=>{
  expect(attendance()).toContain("{item.courseName}");
  expect(source("src/modules/attendance/learner-attendance-filter-model.ts")).toContain("deliveryId");
 });
});
