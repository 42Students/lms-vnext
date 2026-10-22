import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
// The shell orchestrates independently scoped queries; the six legacy
// attention panels now live in an extracted client board.
const dashboard=()=>src("src/app/(authenticated)/college/page.tsx")+
 src("src/components/admin/college-needs-attention-board.tsx");
describe("chat-6 College Admin dashboard verified legacy attention",()=>{
 it("COL-dashboard-03 shows today scheduled held and marked class counters",()=>{
  const ui=dashboard(),svc=src("src/modules/admin-ui/college-dashboard-attendance-service.ts");
  expect(ui).toContain('aria-label="Today"');
  for(const field of ['attendance?.today.scheduled','attendance?.today.held','attendance?.today.marked'])expect(ui).toContain(field);
  expect(svc).toContain("indiaDayBounds(now)");
  expect(svc).toContain("scheduled: sql<number>`count(*)::int`");
 });
 it("COL-dashboard-04 flags held sessions missing marked attendance for 7 days",()=>{
  const ui=dashboard(),svc=src("src/modules/admin-ui/college-dashboard-attendance-service.ts");
  expect(ui).toContain('title="Attendance not taken"');
  expect(ui).toContain('attendance?.unattended.map');
  expect(ui).toContain('href="/college/attendance"');
  expect(svc).toContain("is distinct from 'MARKED'");
  expect(svc).toContain("7 * 86_400_000");
 });
 it("COL-dashboard-05 checks attendance below the college policy threshold over 30 days",()=>{
  const ui=dashboard(),svc=src("src/modules/admin-ui/college-dashboard-risk-service.ts");
  expect(ui).toContain('risk?.rows.map');
  expect(svc).toContain("getCollegeAttendancePolicy");
  expect(svc).toContain('"MARKED"');
  expect(svc).toContain("indiaNow.getUTCDate() - 30");
 });
 it("COL-dashboard-06 shows waiting-to-be-graded submissions per course",()=>{
  const ui=dashboard(),svc=src("src/modules/admin-ui/college-dashboard-grading-service.ts");
  expect(ui).toContain('title="Waiting to be graded"');
  expect(ui).toContain('grades?.map');
  expect(svc).toContain('"NOT_GRADED"');
  expect(svc).toContain('eq(assignmentSubmissions.gradingStatus, "NOT_GRADED")');
  expect(svc).toContain('min(assignmentSubmissions.submittedAt)');
 });
 it("COL-dashboard-07 reports current unstaffed active course deliveries",()=>{
  const ui=dashboard(),svc=src("src/modules/admin-ui/college-dashboard-staffing-service.ts");
  expect(ui).toContain('title="Courses with no teacher"');
  expect(ui).toContain('staffRows.length');
  expect(svc).toContain('isNull(courseTeachingAssignments.id)');
  expect(svc).toContain('eq(academicPeriods.status, "ACTIVE")');
 });
 it("COL-dashboard-08 surfaces specific persisted setup relationship gaps",()=>{
  const ui=dashboard(),svc=src("src/modules/admin-ui/college-dashboard-setup-gaps-service.ts");
  expect(ui).toContain('title="Setup gaps"');
  for(const label of ["Batches without classes","Sections without students","Students not in a class","Courses without lessons"])expect(svc).toContain(label);
  expect(svc).toContain("isNull(sectionEnrollments.id)");
 });
 it("COL-dashboard-09 shows published quizzes closing in the next seven days",()=>{
  const ui=dashboard(),svc=src("src/modules/admin-ui/college-dashboard-quizzes-service.ts");
  expect(ui).toContain('title="Quizzes due soon"');
  expect(ui).toContain("getCollegeClosingQuizzes(context)");
  expect(svc).toContain('eq(courseQuizzes.status,"PUBLISHED")');
  expect(svc).toContain("8*86400000");
 });
 it("COL-dashboard-14 removes developer-only vNext status copy",()=>{
  const ui=src("src/components/admin/admin-dashboard-actions.tsx");
  const cards=src("src/components/admin/college-dashboard-cards.tsx");
  expect(ui).not.toContain("This workflow is not yet available in vNext.");
  expect(cards).not.toContain("Sourced counts, not utilization rates");
  expect(cards).not.toContain("Counts reflect persisted, scoped records");
 });
 it("COL-dashboard-15 handles a missing college membership with the legacy warning",()=>{
  const ui=dashboard();
  expect(ui).toContain("Admin not assigned to a college. Some features are limited.");
  expect(ui).not.toContain('title="College unavailable"');
  expect(ui).not.toContain('redirect("/dashboard")');
 });
 it("COL-dashboard-16 keeps links keyboard accessible and avoids noisy row live regions",()=>{
  const cards=src("src/components/admin/college-dashboard-cards.tsx");
  const setup=src("src/components/admin/college-setup-checklist.tsx");
  expect(cards).toContain('<StatTile key={card.key} variant="college" href={card.href}');
  expect(setup).not.toContain('aria-live="polite"');
  expect(setup).toContain("step.href ? <Link");
 });
});
