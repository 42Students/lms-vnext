import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const code=(path:string)=>readFileSync(path,"utf8");
describe("College Admin dashboard graceful degradation",()=>{
 it("COL-dashboard-10 isolates dashboard data sources with independent failed card states",()=>{
  const page=code("src/app/(authenticated)/college/page.tsx");
  expect(page).toContain("Promise.allSettled([");
  for(const result of ["dashboardResult","attendanceResult","riskResult","staffingResult",
    "gradingResult","setupResult","closingResult"])expect(page).toContain(result+'.status==="fulfilled"');
  for(const section of ["At a glance","Closing quizzes","Today","Attendance not taken",
    "Low attendance","Courses with no teacher","Waiting to be graded","Setup gaps",
    "College setup checklist"])expect(page).toContain('CollegeDashboardSectionFailure title="'+section+'"');
 });
 it("GR-70 and GR-72 preserve primary cards when one secondary dashboard source fails",()=>{
  const page=code("src/app/(authenticated)/college/page.tsx");
  expect(page).toContain("getCollegeDashboardCards(context, {})");
  expect(page).toContain("getCollegeDashboardPendingGrades(context)");
  expect(page).toContain("{pendingGrades?<>");
  expect(page).toContain("{dashboard?<CollegeDashboardCards");
  expect(page).not.toContain("const [dashboard, attendance, lowAttendance");
 });
 it("GR-90 and GR-91 render a keyboard retry and alert rather than false zeroes",()=>{
  const fallback=code("src/components/admin/college-dashboard-section-failure.tsx");
  expect(fallback).toContain('role="alert"');
  expect(fallback).toContain("Could not load this right now. Try again.");
  expect(fallback).toContain('href="/college"');
  expect(fallback).toContain("focus-visible:outline");
 });
});
