import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/components/courses/learner-course-attendance.tsx",import.meta.url),"utf8");
describe("UX-learn-attendance-month-01 /learn/attendance course-month history",()=>{
 it("navigating to another query month recomputes the displayed attendance month instead of reusing mount-only state",()=>{
  expect(source).toContain("const month = useMemo(() =>");
  expect(source).toContain("}, [defaultMonth]);");
  expect(source).not.toContain("const [month] = useState(");
  expect(source).toContain('params.set("month",monthKey(next))');
  expect(source).toContain("router.replace(pathname");
  expect(source).toContain("sameMonth(");
  expect(source).toContain("month,");
 });
 it("unmarked classes never silently count toward the marked percentage, and missing data is explained",()=>{
  expect(source).toContain("summary.markedSessions");
  expect(source).toContain("summary.unmarkedSessions");
  expect(source).toContain("No classes in this period");
  expect(source).toContain("No classes held yet this month.");
  expect(source).toContain("Attendance threshold");
 });
});
