import {describe,expect,it} from "vitest";
import {learnerAssignmentMobileState} from "@/modules/courses/learner-assignment-mobile-model";
import {learnerQuizMobileState} from "@/modules/courses/learner-quiz-mobile-model";

const now=Date.parse("2026-10-19T12:00:00.000Z");
const iso=(ms:number)=>new Date(ms).toISOString();
const assignment=(dueAt:string|null)=>({
 submissionId:null,gradePublished:false,submittedAt:null,dueAt,
});
const quiz=(dueAt:string|null)=>({
 status:"PUBLISHED",resultsPublished:false,
 attemptsUsed:0,attemptsRemaining:1,maxAttempts:1,dueAt,
});
describe("LEARNER-DEADLINE-MOBILE-14 client states match strict server expiry",()=>{
 it("shows an assignment closed at the exact due instant rather than inviting rejected submission",()=>{
  expect(learnerAssignmentMobileState(assignment(iso(now)),now).label).toBe("Closed");
  expect(learnerAssignmentMobileState(assignment(iso(now-1)),now).label).toBe("Closed");
  expect(learnerAssignmentMobileState(assignment(iso(now+1)),now).label).toBe("Due within 24 hours");
 });
 it("closes quiz attempts at due equality and protects unpublished result details",()=>{
  expect(learnerQuizMobileState(quiz(iso(now)),now)).toMatchObject({
   label:"Closed",urgent:false,
  });
  expect(learnerQuizMobileState(quiz(iso(now-1)),now).label).toBe("Closed");
  expect(learnerQuizMobileState(quiz(iso(now+1)),now).label).toBe("Ready to attempt");
  expect(learnerQuizMobileState({...quiz(iso(now)),attemptsUsed:1,attemptsRemaining:0},now).detail)
   .toContain("results may be unpublished");
 });
 it("still honors recorded submissions and authorized published results over the deadline",()=>{
  expect(learnerAssignmentMobileState({...assignment(iso(now-1000)),
   submissionId:"submitted",submittedAt:iso(now-500),gradePublished:true},now).label)
   .toBe("Grade published");
  expect(learnerQuizMobileState({...quiz(iso(now-1000)),attemptsUsed:1,
   attemptsRemaining:0,resultsPublished:true},now).label).toBe("Results available");
 });
 it("does not invent a submission or attempt when no schedule is configured",()=>{
  expect(learnerAssignmentMobileState(assignment(null),now).label).toBe("Unavailable");
  expect(learnerQuizMobileState(quiz(null),now).label).toBe("Unavailable");
 });
});
