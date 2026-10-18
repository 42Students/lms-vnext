import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 select:vi.fn(),
 assignmentRows:[] as Record<string,unknown>[],
 quizRows:[] as Record<string,unknown>[],
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {listOwnLearnerAssessmentRows} from "@/modules/courses/learner-assessment-flat-query";

const course="11111111-1111-4111-8111-111111111111";
const delivery="22222222-2222-4222-8222-222222222222";
const member="33333333-3333-4333-8333-333333333333";
const ids=[{deliveryId:delivery,offeringId:"44444444-4444-4444-8444-444444444444",
 courseId:course,courseName:"Engineering",courseCode:"ENG101"}];
const now=Date.parse("2099-01-01T09:00:00Z");
function assignment(overrides:Record<string,unknown>={}){
 return {
  id:"assignment-1",deliveryId:delivery,lessonId:"lesson-1",lessonName:"Chapter 1",
  title:"Essay",description:"Write",createdAt:new Date("2098-12-01T00:00:00Z"),
  dueAt:new Date("2099-02-01T00:00:00Z"),maxPoints:20,sequence:0,
  submissionId:"submitted",submissionType:"TEXT",submissionText:"Written answer",
  submissionUrl:null,submittedAt:new Date("2099-01-01T08:00:00Z"),
  gradePublished:false,pointsAwarded:16,feedback:"Teacher private notes",gradingStatus:"GRADED",
  ...overrides,
 };
}
function quiz(overrides:Record<string,unknown>={}){
 return {
  id:"quiz-1",deliveryId:delivery,lessonId:"lesson-1",lessonName:"Chapter 1",
  title:"Unit quiz",description:"Test",createdAt:new Date("2098-12-01T00:00:00Z"),
  dueAt:new Date("2099-02-01T00:00:00Z"),maxAttempts:3,totalPoints:10,sequence:0,
  status:"CLOSED",resultsPublished:true,attemptsUsed:1,
  firstSubmittedAt:new Date("2099-01-01T07:00:00Z"),
  ...overrides,
 };
}
beforeEach(()=>{
 state.select.mockReset();state.assignmentRows=[];state.quizRows=[];
 let index=0;
 state.select.mockImplementation(()=>{
  const rows=index++===0?state.assignmentRows:state.quizRows;
  return {from(){return this;},innerJoin(){return this;},leftJoin(){return this;},
   where(){return Promise.resolve(rows);}};
 });
});
describe("LEARNER-ASSESSMENT-FEED-PRIVACY-01 selected course dashboard projection",()=>{
 it("never queries the database for a learner with no authorized deliveries",async()=>{
  expect(await listOwnLearnerAssessmentRows([],member,now)).toEqual({assignments:[],quizzes:[]});
  expect(state.select).not.toHaveBeenCalled();
 });
 it("never exposes privately saved grades or feedback before publish, even when graded",async()=>{
  state.assignmentRows=[assignment()];
  const result=await listOwnLearnerAssessmentRows(ids,member,now);
  expect(result.assignments).toHaveLength(1);
  const item=result.assignments[0]!;
  expect(item.courseId).toBe(course);
  expect(item.deliveryId).toBe(delivery);
  expect(item.gradePublished).toBe(false);
  expect(item.pointsAwarded).toBeNull();
  expect(item.feedback).toBeNull();
  expect(item.gradingStatus).toBe("NOT_GRADED");
  expect(item.progress.status).toBe("COMPLETED");
 });
 it("reveals an explicitly published score only after the persisted flag changes",async()=>{
  state.assignmentRows=[assignment({gradePublished:true})];
  const result=await listOwnLearnerAssessmentRows(ids,member,now);
  expect(result.assignments[0]).toMatchObject({
   gradePublished:true,pointsAwarded:16,feedback:"Teacher private notes",
   gradingStatus:"GRADED",
  });
 });
 it("does not reveal even flagged quiz results until both the deadline and close rule hold",async()=>{
  state.quizRows=[quiz()];
  const earlier=await listOwnLearnerAssessmentRows(ids,member,now);
  expect(earlier.quizzes[0]).toMatchObject({
   resultsPublished:false,attemptsRemaining:0,status:"CLOSED",
   progress:{status:"COMPLETED",percentComplete:100},
  });
  state.quizRows=[quiz({dueAt:new Date("2098-12-31T00:00:00Z")})];
  const later=await listOwnLearnerAssessmentRows(ids,member,now);
  expect(later.quizzes[0]?.resultsPublished).toBe(true);
 });
 it("does not invent a passed quiz on a closed/missed attempt, or allow retries on closed quizzes",async()=>{
  state.quizRows=[quiz({attemptsUsed:0,firstSubmittedAt:null,resultsPublished:false})];
  const result=await listOwnLearnerAssessmentRows(ids,member,now);
  expect(result.quizzes[0]).toMatchObject({
   attemptsUsed:0,attemptsRemaining:0,
   progress:{status:"MISSED",percentComplete:0,completedAt:null},
  });
 });
});
