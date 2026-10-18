import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 reads:0,
 assignmentRows:[] as Array<Record<string,unknown>>,
 quizRows:[] as Array<Record<string,unknown>>,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>{
   const data=state.reads++===0?state.assignmentRows:state.quizRows;
   const chain={
    from(){return chain;},
    innerJoin(){return chain;},
    leftJoin(){return chain;},
    where(){return Promise.resolve(data);},
   };
   return chain;
  },
 }),
}));
import {listOwnLearnerAssessmentRows} from "@/modules/courses/learner-assessment-flat-query";
import {learnerAssessmentMatchesState} from "@/modules/courses/learner-assessment-state-filter-model";

const deliveryId="11111111-1111-4111-8111-111111111111";
const delivery=[{
 deliveryId,offeringId:"22222222-2222-4222-8222-222222222222",
 courseId:"33333333-3333-4333-8333-333333333333",
 courseName:"Algorithms",courseCode:"CS101",
}];
const now=Date.parse("2026-10-18T00:00:00.000Z");
const assignment=(gradePublished:boolean)=>({
 deliveryId,lessonId:"l1",lessonName:"Week 1",id:"a1",title:"Homework",
 description:null,dueAt:new Date(now+86400000),createdAt:new Date(now-86400000),
 maxPoints:20,sequence:0,submissionId:"s1",submissionType:"TEXT",
 submissionText:"my work",submissionUrl:null,submittedAt:new Date(now-3600000),
 gradePublished,pointsAwarded:18,feedback:"Private marker notes",gradingStatus:"GRADED",
});
const quiz=(status:"PUBLISHED"|"CLOSED",resultsPublished:boolean)=>({
 deliveryId,lessonId:"l1",lessonName:"Week 1",id:"q1",title:"Review quiz",
 description:null,dueAt:new Date(now-1000),createdAt:new Date(now-86400000),
 maxAttempts:2,totalPoints:10,sequence:0,status,resultsPublished,
 attemptsUsed:1,firstSubmittedAt:new Date(now-3600000),
});
beforeEach(()=>{
 state.reads=0;state.assignmentRows=[];state.quizRows=[];
});
describe("COURSES7-06 learner assessment results are released only after official publication",()=>{
 it("no authorized delivery IDs means no database reads and no results",async()=>{
  expect(await listOwnLearnerAssessmentRows([],deliveryId,now)).toEqual({assignments:[],quizzes:[]});
  expect(state.reads).toBe(0);
 });
 it("keeps graded but unreleased assignment points and feedback private",async()=>{
  state.assignmentRows=[assignment(false)];
  const out=await listOwnLearnerAssessmentRows(delivery,deliveryId,now);
  expect(out.assignments[0]).toMatchObject({
   gradePublished:false,pointsAwarded:null,feedback:null,gradingStatus:"NOT_GRADED",
  });
  expect(state.reads).toBe(2);
 });
 it("reveals only explicitly published assignment feedback",async()=>{
  state.assignmentRows=[assignment(true)];
  const out=await listOwnLearnerAssessmentRows(delivery,deliveryId,now);
  expect(out.assignments[0]).toMatchObject({
   gradePublished:true,pointsAwarded:18,feedback:"Private marker notes",gradingStatus:"GRADED",
  });
 });
 it.each([
  ["PUBLISHED",true,false],
  ["PUBLISHED",false,false],
  ["CLOSED",false,false],
  ["CLOSED",true,true],
 ] as const)("quiz %s, release flag %s => learner visibility %s",async(status,release,visible)=>{
  state.quizRows=[quiz(status,release)];
  const out=await listOwnLearnerAssessmentRows(delivery,deliveryId,now);
  const item=out.quizzes[0];
  expect(item.resultsPublished).toBe(visible);
  expect(learnerAssessmentMatchesState({kind:"QUIZ",attemptsUsed:item.attemptsUsed,
   attemptsRemaining:item.attemptsRemaining,status:item.status,
   dueAt:item.dueAt?.toISOString()??null,resultsPublished:item.resultsPublished},"RESULTS",now)).toBe(visible);
 });
});
