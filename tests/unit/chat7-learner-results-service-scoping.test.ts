import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";

const state=vi.hoisted(()=>({
 access:vi.fn(),own:vi.fn(),quizScope:vi.fn(),assignmentScope:vi.fn(),
 reads:0,conditions:[] as unknown[],
 attempts:[] as Array<Record<string,unknown>>,
 answers:[] as Array<Record<string,unknown>>,
 submission:[] as Array<Record<string,unknown>>,
}));
vi.mock("@/modules/courses/learner-access-guard",()=>({requireOwnCourseLearnerRead:state.own}));
vi.mock("@/modules/courses/learning-access",()=>({
 requireLearningReadAccess:state.access,
 requireDeliveryContentMutation:vi.fn(),
}));
vi.mock("@/modules/courses/quiz-scope",()=>({loadCourseQuizScope:state.quizScope}));
vi.mock("@/modules/courses/assignment-scope",()=>({
 loadCourseAssignmentScope:state.assignmentScope,loadAssignmentSubmissionScope:vi.fn(),
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>{
   const call=state.reads++;
   const chain={
    from(){return chain;},
    innerJoin(){return chain;},
    where(condition:unknown){state.conditions.push(condition);return chain;},
    orderBy(){return Promise.resolve(call===0?state.attempts:state.answers);},
    limit(){return Promise.resolve(state.submission);},
   };
   return chain;
  },
 }),
}));
import {getMyQuizAttempts} from "@/modules/courses/quiz-attempt-service";
import {getMyAssignmentSubmission} from "@/modules/courses/assignment-submission-service";

const quizId="11111111-1111-4111-8111-111111111111";
const assignmentId="22222222-2222-4222-8222-222222222222";
const deliveryId="33333333-3333-4333-8333-333333333333";
const memberId="44444444-4444-4444-8444-444444444444";
const actor={user:{id:"55555555-5555-4555-8555-555555555555"},
 membership:{id:memberId,roles:["LEARNER"],collegeId:"66666666-6666-4666-8666-666666666666"}};
const context=actor as unknown as Parameters<typeof getMyQuizAttempts>[0];
const sqlWhere=(condition:unknown)=>new PgDialect().sqlToQuery(condition as SQL).sql;
beforeEach(()=>{
 state.reads=0;state.conditions.length=0;
 state.attempts=[];state.answers=[];state.submission=[];
 for(const mock of [state.access,state.own,state.quizScope,state.assignmentScope])mock.mockReset();
 state.access.mockResolvedValue("LEARNER");
 state.quizScope.mockResolvedValue({status:"CLOSED",resultsPublished:false,dueAt:new Date("2026-01-01T00:00:00Z"),deliveryId:null,
  offeringId:"77777777-7777-4777-8777-777777777777"});
 state.assignmentScope.mockResolvedValue({deliveryId:null,offeringId:"77777777-7777-4777-8777-777777777777"});
});
describe("COURSES7-07 / COURSES7-08 learner owner isolation and historical submission continuity",()=>{
 const attempt={id:"88888888-8888-4888-8888-888888888888",
  quizId,deliveryId,membershipId:memberId,score:10,maxScore:10,attemptNumber:1};
 const answer={id:"99999999-9999-4999-8999-999999999999",attemptId:attempt.id,
  questionId:"q",questionType:"SINGLE_CHOICE",promptSnapshot:"Private grading",
  pointsPossible:10,selectedOptionIds:["choice"],correct:true,pointsAwarded:10,
  optionsSnapshot:[{id:"choice",text:"Correct answer",correct:true,sequence:0}],
  createdAt:new Date()};
 it("uses quiz ID and own membership, after authorizing the requested delivery",async()=>{
  state.attempts=[attempt];state.answers=[answer];
  const out=await getMyQuizAttempts(context,quizId,deliveryId);
  expect(out).toHaveLength(1);
  expect(state.conditions.length).toBe(2);
  const sql=sqlWhere(state.conditions[0]);
  expect(sql).toContain("quiz_id");
  expect(sql).toContain("membership_id");
  expect(state.access).toHaveBeenCalledWith(context,
   "77777777-7777-4777-8777-777777777777",deliveryId);
  expect(out[0].score).toBeNull();
  expect(out[0].maxScore).toBeNull();
  expect(out[0].resultsVisible).toBe(false);
  expect(out[0].answers[0]).not.toHaveProperty("correct");
  expect(out[0].answers[0]).not.toHaveProperty("pointsAwarded");
  expect(out[0].answers[0]).not.toHaveProperty("options");
 });
 it("does not reveal answer keys just because an open quiz has a stale published flag",async()=>{
  state.attempts=[attempt];state.answers=[answer];
  state.quizScope.mockResolvedValueOnce({status:"PUBLISHED",resultsPublished:true,dueAt:new Date("2026-01-01T00:00:00Z"),
   deliveryId:null,offeringId:"77777777-7777-4777-8777-777777777777"});
  const out=await getMyQuizAttempts(context,quizId,deliveryId);
  expect(out[0].resultsVisible).toBe(false);
  expect(out[0].score).toBeNull();
  expect(out[0].answers[0]).not.toHaveProperty("options");
 });
 it("reveals score and correctness only after CLOSED plus explicit result release",async()=>{
  state.attempts=[attempt];state.answers=[answer];
  state.quizScope.mockResolvedValueOnce({status:"CLOSED",resultsPublished:true,
   deliveryId:null,offeringId:"77777777-7777-4777-8777-777777777777"});
  const out=await getMyQuizAttempts(context,quizId,deliveryId);
  expect(out[0].resultsVisible).toBe(true);
  expect(out[0].score).toBe(10);
  expect(out[0].answers[0].correct).toBe(true);
 });
 it("denies wrong role before fetching own attempt rows",async()=>{
  state.access.mockResolvedValueOnce("FACULTY");
  await expect(getMyQuizAttempts(context,quizId,deliveryId)).rejects.toThrow();
  expect(state.reads).toBe(0);
 });
 it("preserves the learner’s one shared-assignment submission after section moves",async()=>{
  state.submission=[{
   id:"sub1",gradePublished:false,pointsAwarded:8,feedback:"Private",
   gradingStatus:"GRADED",gradedByUserId:"faculty1",gradedAt:new Date(),
  }];
  const out=await getMyAssignmentSubmission(context,assignmentId,deliveryId);
  expect(out).toMatchObject({gradePublished:false,pointsAwarded:null,
   feedback:null,gradingStatus:"NOT_GRADED",gradedByUserId:null,gradedAt:null});
  const sql=sqlWhere(state.conditions[0]);
  expect(sql).toContain("assignment_id");
  expect(sql).toContain("membership_id");
  expect(state.access).toHaveBeenCalledWith(context,
   "77777777-7777-4777-8777-777777777777",deliveryId);
 });
});
