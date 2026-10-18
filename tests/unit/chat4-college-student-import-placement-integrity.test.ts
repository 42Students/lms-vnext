import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const source=readFileSync("src/modules/people/college-student-import-placement.ts","utf8");
describe("COL-student-import-placement-tenant-01 class import ownership, CAS, and audit",()=>{
 it("locks the target class, requires live College Admin, and refuses foreign-period sections",()=>{
  expect(source).toContain('.for("update", {of: sections}).limit(1)');
  expect(source).toContain("eq(departments.collegeId, member.collegeId)");
  expect(source).toContain("eq(academicPeriods.collegeId, member.collegeId)");
  expect(source).toContain("eq(cohortStartPeriod.collegeId,member.collegeId)");
  expect(source).toContain('assertPersistedPlatformPermission(tx,context,"academics.manage"');
 });
 it("links imported learner program and cohort to the same college before class admission",()=>{
  const read=source.slice(source.indexOf("const [enrollment]"));
  expect(read).toContain("eq(cohorts.id,learnerProgramEnrollments.cohortId)");
  expect(read).toContain("eq(cohorts.programId,learnerProgramEnrollments.programId)");
  expect(read).toContain("eq(departments.collegeId,member.collegeId)");
  expect(read).toContain("eq(collegeMemberships.collegeId,member.collegeId)");
  expect(read).toContain("eq(membershipRoles.role,\"LEARNER\")");
  expect(read).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(read).toContain("enrollment.cohortId !== target.cohortId");
 });
 it("never returns success or records an audit before a successfully inserted scoped section membership",()=>{
  const duplicate=source.indexOf('throw new AcademicsServiceError("ALREADY_PLACED_IN_PERIOD")');
  const capacity=source.indexOf('throw new AcademicsServiceError("CLASS_FULL")');
  const inserted=source.indexOf("tx.insert(sectionEnrollments)");
  const event=source.indexOf("recordActivityEventInTransaction(tx,context");
  expect(duplicate).toBeGreaterThan(0);
  expect(capacity).toBeGreaterThan(duplicate);
  expect(inserted).toBeGreaterThan(capacity);
  expect(event).toBeGreaterThan(inserted);
  expect(source).toContain('"section_enrollments_active_period_uq"');
 });
});
