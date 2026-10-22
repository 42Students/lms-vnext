import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {facultyReportCurrentRosterRows,getFacultyQuizReport,
 getFacultyAssignmentReport} from "@/modules/courses/faculty-assessment-report-service";
import {CoursesServiceError} from "@/modules/courses/errors";
import type {RequestContext} from "@/modules/identity/context";

const deliveryId="11111111-1111-4111-8111-111111111111";
const anotherDelivery="22222222-2222-4222-8222-222222222222";
const quizId="33333333-3333-4333-8333-333333333333";
const assignmentId="44444444-4444-4444-8444-444444444444";
const learnerId="55555555-5555-4555-8555-555555555555";
const foreignLearner="66666666-6666-4666-8666-666666666666";
const at=(hour:number)=>new Date("2026-10-18T"+String(hour).padStart(2,"0")+":00:00.000Z");
const state=vi.hoisted(()=>({
 overviews:0,attemptReads:0,submissionReads:0,rosterReads:0,quizReads:0,rosterFailure:false,
 quizzes:[] as Array<{id:string;deliveryId:string;status:string;title:string}>,
 assignments:[] as Array<{id:string;deliveryId:string;status:string;title:string;dueAt:Date|null;maxPoints:number}>,
 attempts:[] as Array<{membershipId:string;submittedAt:Date;attemptNumber:number;
  score:number;maxScore:number;answers:{questionId:string;correct:boolean}[]}>,
 submissions:[] as Array<{membershipId:string;gradingStatus:string;gradePublished:boolean;
  pointsAwarded:number|null;submittedAt:Date}>,
}));
vi.mock("@/modules/courses/faculty-assessment-service",()=>({
 getFacultyAssessmentOverview:async()=>{
  state.overviews++;return {quizzes:state.quizzes,assignments:state.assignments};
 },
}));
vi.mock("@/modules/courses/quiz-attempt-service",()=>({
 listQuizAttempts:async()=>{state.attemptReads++;return state.attempts;},
}));
vi.mock("@/modules/courses/quiz-service",()=>({
 getCourseQuiz:async()=>{state.quizReads++;return {questions:[{
  id:"77777777-7777-4777-8777-777777777777",prompt:"What?",points:1,
 }]};},
}));
vi.mock("@/modules/courses/assignment-submission-service",()=>({
 listAssignmentSubmissions:async()=>{state.submissionReads++;return state.submissions;},
}));
vi.mock("@/modules/attendance/faculty-service",()=>({
 getFacultyDeliveryRoster:async(_ctx:unknown,id:string)=>{
  state.rosterReads++;
  if(state.rosterFailure)throw new Error("Current roster could not be loaded");
  if(id!==deliveryId)throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  return {roster:[{membershipId:learnerId,displayName:"Section learner"}]};
 },
}));
const actor:RequestContext={
 user:{id:"88888888-8888-4888-8888-888888888888",
  platformStatus:"ACTIVE",identityUid:"assigned-faculty",systemRoles:[]},
 membership:{id:"99999999-9999-4999-8999-999999999999",
  collegeId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  organizationId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  status:"ACTIVE",roles:["FACULTY"]},
};
const questionId="77777777-7777-4777-8777-777777777777";
describe("COURSES-BREAK-FACULTY-06 current-roster report anti-IDOR and consistency",()=>{
 it("enforces tenant membership and delivery scope before reporting historical submissions",()=>{
  const quizSource=readFileSync(new URL("../../src/modules/courses/quiz-attempt-service.ts",import.meta.url),"utf8");
  const assignmentSource=readFileSync(new URL("../../src/modules/courses/assignment-submission-service.ts",import.meta.url),"utf8");
  expect(quizSource).toContain("eq(collegeMemberships.collegeId,quiz.collegeId)");
  expect(quizSource).toContain("eq(quizAttempts.deliveryId,");
  expect(assignmentSource).toContain("eq(assignmentSubmissions.deliveryId,");
  expect(assignmentSource).toContain("requireDeliveryContentMutation(");
 });
 beforeEach(()=>{
  state.overviews=0;state.attemptReads=0;state.submissionReads=0;
  state.rosterReads=0;state.quizReads=0;state.rosterFailure=false;
  state.quizzes=[{id:quizId,deliveryId,status:"CLOSED",title:"Midterm"}];
  state.assignments=[{id:assignmentId,deliveryId,status:"PUBLISHED",
   title:"Essay",maxPoints:10,dueAt:at(10)}];
  state.attempts=[
   {membershipId:learnerId,attemptNumber:1,submittedAt:at(8),
    score:2,maxScore:10,answers:[{questionId,correct:false}]},
   {membershipId:learnerId,attemptNumber:2,submittedAt:at(9),
    score:5,maxScore:10,answers:[{questionId,correct:false}]},
   {membershipId:foreignLearner,attemptNumber:1,submittedAt:at(9),
    score:10,maxScore:10,answers:[{questionId,correct:true}]},
  ];
  state.submissions=[
   {membershipId:learnerId,gradingStatus:"GRADED",
    gradePublished:true,pointsAwarded:5,submittedAt:at(9)},
   {membershipId:foreignLearner,gradingStatus:"GRADED",
    gradePublished:true,pointsAwarded:10,submittedAt:at(11)},
  ];
 });
 it("FAC-assessments-01 retains delivery-authorized historical attempts while current roster controls missing counts",async()=>{
  const report=await getFacultyQuizReport(actor,quizId,deliveryId);
  expect(report.attempts).toHaveLength(3);
  expect(report.latestAttempts).toHaveLength(2);
  expect(report.metrics).toMatchObject({
   totalAttempts:3,eligibleLearners:1,uniqueLearners:2,
   submittedLearners:2,notAttempted:0,averagePercent:75,
  });
  expect(report.questions).toMatchObject([{correctCount:1,answeredCount:2,accuracyPercent:50}]);
  expect(report.latestAttempts.map(row=>row.membershipId)).toContain(foreignLearner);
 });
 it("FAC-assessments-01 retains historical delivery submissions and excludes them only from missing-roster counts",async()=>{
  const report=await getFacultyAssignmentReport(actor,assignmentId,deliveryId);
  expect(report.submissions).toHaveLength(2);
  expect(report.metrics).toMatchObject({eligibleLearners:1,submitted:2,
   missing:0,onTime:1,late:1,graded:2,gradePublished:2,averagePercent:75});
  expect(report.submissions.map(row=>row.membershipId)).toContain(foreignLearner);
 });
 it("preserves delivery-authorized submissions and attempts during roster failure with unknown absence counts",async()=>{
  state.rosterFailure=true;
  const assignment=await getFacultyAssignmentReport(actor,assignmentId,deliveryId);
  expect(assignment.rosterUnavailable).toBe(true);
  expect(assignment.reportCompleteness).toBe("PARTIAL_ROSTER_UNAVAILABLE");
  expect(assignment.metrics).toMatchObject({submitted:2,eligibleLearners:null,missing:null});
  expect(assignment.submissions).toHaveLength(2);
  const quiz=await getFacultyQuizReport(actor,quizId,deliveryId);
  expect(quiz.rosterUnavailable).toBe(true);
  expect(quiz.reportCompleteness).toBe("PARTIAL_ROSTER_UNAVAILABLE");
  expect(quiz.metrics).toMatchObject({eligibleLearners:null,notAttempted:null});
  expect(quiz.attempts).toHaveLength(3);
 });
 it("FAC-assessments-03 non-finite submitted scores cannot inflate the grade distribution",async()=>{
  for(const [score,maxScore] of [
   [5,Infinity],[NaN,10],[Infinity,10],[5,NaN],
  ]){
   state.attempts=[{
    membershipId:learnerId,attemptNumber:1,submittedAt:at(9),
    score,maxScore,answers:[{questionId,correct:false}],
   }];
   const report=await getFacultyQuizReport(actor,quizId,deliveryId);
   expect(report.metrics).toMatchObject({
    eligibleLearners:1,submittedLearners:1,graded:0,averagePercent:null,
   });
   expect(report.distribution.reduce((count,bucket)=>count+bucket.count,0)).toBe(0);
  }
 });
 it("FAC-assessments-01 count equality holds across malformed, duplicate and out-of-roster evidence",()=>{
  expect(facultyReportCurrentRosterRows([
   {membershipId:learnerId,score:1},{membershipId:foreignLearner,score:100},
   {membershipId:learnerId,score:2},
  ],[{membershipId:learnerId}]).map(x=>x.score)).toEqual([1,2]);
  expect(facultyReportCurrentRosterRows([{membershipId:foreignLearner}],
   [])).toEqual([]);
 });
 it("FAC-assessments-01 ambiguous legacy quiz ID across Sections is hidden before any score read",async()=>{
  state.quizzes.push({id:quizId,deliveryId:anotherDelivery,status:"CLOSED",title:"Midterm"});
  await expect(getFacultyQuizReport(actor,quizId,null))
   .rejects.toMatchObject({code:"QUIZ_DELIVERY_MISMATCH"});
  expect(state.attemptReads).toBe(0);
  expect(state.rosterReads).toBe(0);
 });
 it("FAC-assessments-01 guessed foreign delivery or malformed route key cannot read attempts or submissions",async()=>{
  await expect(getFacultyQuizReport(actor,quizId,anotherDelivery))
   .rejects.toMatchObject({code:"QUIZ_NOT_FOUND"});
  await expect(getFacultyAssignmentReport(actor,assignmentId,anotherDelivery))
   .rejects.toMatchObject({code:"ASSIGNMENT_NOT_FOUND"});
  await expect(getFacultyQuizReport(actor,"not-uuid",deliveryId)).rejects.toThrow();
  expect(state.attemptReads).toBe(0);
  expect(state.submissionReads).toBe(0);
  expect(state.rosterReads).toBe(0);
 });
});
