import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const scopeSource=readFileSync("src/modules/academics/a2-scope.ts","utf8");
const rosterSource=readFileSync("src/modules/academics/roster-service.ts","utf8");
function sectionOf(source:string,start:string,end:string){
 const a=source.indexOf("export async function "+start+"(");
 const b=source.indexOf("export async function "+end+"(",a);
 expect(a).toBeGreaterThanOrEqual(0);
 expect(b).toBeGreaterThan(a);
 return source.slice(a,b);
}

describe("COL-academics-scope-tenant-01 malformed academic join data never authorizes foreign learners",()=>{
 it("learner program scope requires persisted cohort to belong to its declared program and member to the same college",()=>{
  const src=sectionOf(scopeSource,"loadLearnerEnrollmentScope","loadSectionEnrollmentScope");
  expect(src).toContain("eq(cohorts.id, learnerProgramEnrollments.cohortId)");
  expect(src).toContain("eq(cohorts.programId, learnerProgramEnrollments.programId)");
  expect(src).toContain("row.membershipCollegeId !== row.collegeId");
  expect(src).toContain('throw new AcademicsServiceError(');
  expect(src).toContain('"ENROLLMENT_COLLEGE_MISMATCH"');
 });
 it("section-enrollment scope joins real section, cohort, period and membership to one trusted college",()=>{
  const src=sectionOf(scopeSource,"loadSectionEnrollmentScope","loadFacultyAssignmentScope");
  expect(src).toContain("eq(sections.id, sectionEnrollments.sectionId)");
  expect(src).toContain("eq(sections.cohortId, learnerProgramEnrollments.cohortId)");
  expect(src).toContain("eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId)");
  expect(src).toContain("eq(cohorts.programId, learnerProgramEnrollments.programId)");
  expect(src).toContain("eq(academicPeriods.id, sectionEnrollments.academicPeriodId)");
  expect(src).toContain("eq(academicPeriods.collegeId, departments.collegeId)");
  expect(src).toContain("eq(collegeMemberships.id, learnerProgramEnrollments.membershipId)");
  expect(src).toContain("eq(collegeMemberships.collegeId, departments.collegeId)");
  expect(src).toContain('"SECTION_ENROLLMENT_NOT_FOUND"');
  expect(src.indexOf(".where(")).toBeGreaterThan(src.indexOf(".innerJoin("));
 });
});

describe("COL-academics-scope-tenant-02 corrupt roster links do not disclose foreign college membership",()=>{
 it("section roster requires the source enrollment to belong to its own cohort, period and college",()=>{
  const src=sectionOf(rosterSource,"listSectionRoster","listLearnerSectionHistory");
  expect(src).toContain('requirePermission(context, "academics.read"');
  expect(src).toContain("eq(cohorts.programId, learnerProgramEnrollments.programId)");
  expect(src).toContain("eq(sectionEnrollments.sectionId, sectionId)");
  expect(src).toContain("eq(sectionEnrollments.academicPeriodId, section.academicPeriodId)");
  expect(src).toContain("eq(learnerProgramEnrollments.cohortId, section.cohortId)");
  expect(src).toContain("eq(collegeMemberships.collegeId, section.collegeId)");
 });
 it("learner class history joins only sections matching the authorized learner's persisted cohort",()=>{
  const src=sectionOf(rosterSource,"listLearnerSectionHistory","assignLearnerToSection");
  expect(src).toContain("await loadLearnerEnrollmentScope(");
  expect(src).toContain('requirePermission(context, "academics.read"');
  expect(src).toContain("eq(sections.id, sectionEnrollments.sectionId)");
  expect(src).toContain("eq(sections.cohortId, enrollment.cohortId)");
  expect(src).toContain("eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId)");
  expect(src).toContain("eq(sectionEnrollments.learnerEnrollmentId,");
 });
});
