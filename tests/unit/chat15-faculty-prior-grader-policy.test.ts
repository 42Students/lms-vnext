import {describe,expect,it} from "vitest";
import {legacyPriorGraderEligible} from "@/modules/courses/faculty-prior-grader-policy";
const member={
 collegeId:"college-1",status:"ACTIVE",
 roles:["FACULTY"],userId:"teacher-1",
} as const;
describe("G2-2-026 faculty prior grader parity",()=>{
 it("permits only the original faculty grader's still-active membership",()=>{
  expect(legacyPriorGraderEligible({
   userId:"teacher-1",gradedByUserId:"teacher-1",collegeId:"college-1",
   membership:member,
  })).toBe(true);
 });
 it("never admits another grader, college, revoked membership or role",()=>{
  expect(legacyPriorGraderEligible({userId:"teacher-2",
   gradedByUserId:"teacher-1",collegeId:"college-1",membership:member})).toBe(false);
  expect(legacyPriorGraderEligible({userId:"teacher-1",
   gradedByUserId:"teacher-1",collegeId:"college-2",membership:member})).toBe(false);
  expect(legacyPriorGraderEligible({userId:"teacher-1",
   gradedByUserId:"teacher-1",collegeId:"college-1",
   membership:{...member,status:"ARCHIVED"}})).toBe(false);
  expect(legacyPriorGraderEligible({userId:"teacher-1",
   gradedByUserId:"teacher-1",collegeId:"college-1",
   membership:{...member,roles:["LEARNER"]}})).toBe(false);
  expect(legacyPriorGraderEligible({userId:"teacher-1",
   gradedByUserId:null,collegeId:"college-1",membership:member})).toBe(false);
 });
});
