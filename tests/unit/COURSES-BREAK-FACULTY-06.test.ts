import {beforeEach,describe,expect,it,vi} from "vitest";
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
 overviews:0,attemptReads:0,submissionReads:0,rosterReads:0,quizReads:0,
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
 beforeEach(()=>{
  state.overviews=0;state.attemptReads=0;state.submissionReads=0;
  state.rosterReads=0;state.quizReads=0;
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
 it("FAC-assessments-01 filters foreign and unenrolled learner attempts before summary and per-question accuracy",async()=>{
  const report=await getFacultyQuizReport(actor,quizId,deliveryId);
  expect(report.attempts).toHaveLength(2);
  expect(report.latestAttempts).toHaveLength(1);
  expect(report.metrics).toMatchObject({
   totalAttempts:2,eligibleLearners:1,uniqueLearners:1,
   submittedLearners:1,notAttempted:0,averagePercent:50,
  });
  expect(report.questions).toMatchObject([{correctCount:0,answeredCount:1,accuracyPercent:0}]);
  expect(JSON.stringify(report)).not.toContain(foreignLearner);
 });
 it("FAC-assessments-01 excludes foreign submissions from published grades, missing counts and late statistics",async()=>{
  const report=await getFacultyAssignmentReport(actor,assignmentId,deliveryId);
  expect(report.submissions).toHaveLength(1);
  expect(report.metrics).toMatchObject({eligibleLearners:1,submitted:1,
   missing:0,onTime:1,late:0,graded:1,gradePublished:1,averagePercent:50});
  expect(JSON.stringify(report)).not.toContain(foreignLearner);
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
