import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {summarizePromotionFacultyReadiness} from "@/modules/academics/college-promotion-faculty-readiness";

describe("College batch promotion faculty readiness: current role, duplicate and missing staff",()=>{
 it("COL-academics-promotion-readiness-01 no term courses and a fully unstaffed term are not falsely ready",()=>{
  expect(summarizePromotionFacultyReadiness([],[])).toEqual({
   incomplete:true,missingCourses:0,totalCourses:0,
  });
  expect(summarizePromotionFacultyReadiness(["c1","c2","c3"],[])).toEqual({
   incomplete:true,missingCourses:3,totalCourses:3,
  });
 });
 it("COL-academics-promotion-readiness-02 at least one ACTIVE Faculty per course; duplicates do not hide missing courses",()=>{
  expect(summarizePromotionFacultyReadiness(["c1","c2"],["c1","c1"])).toEqual({
   incomplete:true,missingCourses:1,totalCourses:2,
  });
  expect(summarizePromotionFacultyReadiness(["c1","c2"],["c1","c2","c2"])).toEqual({
   incomplete:false,missingCourses:0,totalCourses:2,
  });
  expect(summarizePromotionFacultyReadiness(["c1","c2"],["unrelated"])).toEqual({
   incomplete:true,missingCourses:2,totalCourses:2,
  });
 });
 it("COL-academics-promotion-readiness-03 SQL requires same-college ACTIVE current FACULTY membership, user and assignment",()=>{
  const code=readFileSync("src/modules/academics/college-promotion-faculty-readiness.ts","utf8");
  for(const condition of [
   "eq(departments.collegeId, member.collegeId)",
   "eq(courseOfferings.cohortId, cohortId)",
   "eq(collegeMemberships.id, courseTeachingAssignments.membershipId)",
   'eq(membershipRoles.role, "FACULTY")',
   'eq(collegeMemberships.collegeId,member.collegeId)',
   'eq(collegeMemberships.status,"ACTIVE")',
   'eq(users.platformStatus,"ACTIVE")',
   "isNull(courseTeachingAssignments.endedAt)",
   "isNull(courseSectionDeliveries.endedAt)",
  ])expect(code).toContain(condition);
  expect(code).toContain("summarizePromotionFacultyReadiness(");
 });
});
