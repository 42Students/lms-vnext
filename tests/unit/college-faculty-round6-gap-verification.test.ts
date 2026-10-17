import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {facultyCorrectionReasonValid,facultyAttendanceConfirmation} from "@/modules/attendance/faculty-correction-audit-model";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");

describe("chat-11 College roster and Faculty attendance source parity",()=>{
 it("COL-academic-setup-28 verifies batch roster, search and class-move entry",()=>{
  const roster=src("src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx");
  expect(roster).toContain('learnerProgramEnrollments.cohortId, batch.id');
  expect(roster).toContain('ilike(learnerProfiles.rollNumber');
  expect(roster).toContain('className="overflow-x-auto');
  expect(roster).toContain("StudentClassMoveAction");
  expect(roster).toContain("sectionId");
  const move=src("src/components/college/student-class-move-action.tsx");
  expect(move).toContain('expectedSectionEnrollmentId: loaded.current.id');
  expect(move).toContain("Confirm move");
  expect(src("src/components/academics/college-academic-directory.tsx")).toContain('"/students"');
 });
 it("FAC-attendance-grades-14 restores legacy attendance subtitle while keeping useful coverage navigation",()=>{
  const ui=src("src/components/attendance/faculty-attendance-workspace.tsx");
  expect(ui).toContain('<h1 className="sr-only">Attendance</h1>');
  expect(ui).toContain("See attendance history and monthly trends in one place.");
  expect(src("src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx")).toContain("Review session coverage");
 });
 it("FAC-attendance-grades-15 keeps audited correction reason and optimistic version checks",()=>{
  expect(facultyCorrectionReasonValid("short")).toBe(false);
  expect(facultyCorrectionReasonValid("Correcting the roster")).toBe(true);
  expect(facultyAttendanceConfirmation(true,["a"],["a"],2)).toBeNull();
  expect(facultyAttendanceConfirmation(true,["a"],[],2)).toContain("explanation will be retained");
  const ui=src("src/components/attendance/faculty-attendance-workspace.tsx");
  expect(ui).toContain("expectedMarkedAt");
  expect(ui).toContain("facultyCorrectionReasonValid(correctionReason)");
 });
 it("FAC-attendance-grades-18 verifies explicit membership lists and disjoint attendance marks",()=>{
  const code=src("src/modules/attendance/faculty-service.ts");
  expect(code).toContain("absentMembershipIds: z.array(uuid).max(1000)");
  expect(code).toContain("presentMembershipIds: z.array(uuid).max(1000)");
  expect(code).toContain("A learner cannot be both present and absent");
  expect(code).toContain("Absent learners must be unique");
 });
 it("FAC-attendance-grades-19 avoids developer risk-rule copy and honors college threshold",()=>{
  const signals=src("src/components/courses/faculty-course-home-signals.tsx");
  expect(signals).not.toContain("currently match the legacy risk rules");
  expect(src("src/components/attendance/faculty-attendance-workspace.tsx")).toContain("workspace.policy.eligibilityThresholdPercent");
 });
 it("FAC-attendance-grades-22 avoids extra invented Faculty eyebrow copy",()=>{
  const base="src/app/(authenticated)/teacher/courses/[deliveryId]/";
  for(const part of ["gradebook","reports","session-coverage"]){
   const code=src(base+part+"/page.tsx");
   expect(code).toContain("<PageHeader title=");
   expect(code).not.toContain('eyebrow="Faculty');
  }
 });
});
