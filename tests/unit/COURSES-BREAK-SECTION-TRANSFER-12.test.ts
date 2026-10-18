import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";

const state=vi.hoisted(()=>({
 reads:0,
 projections:[] as Array<Record<string,unknown>>,
 joins:[] as unknown[],
 where:[] as unknown[],
 assignment:[] as Array<Record<string,unknown>>,
 quizzes:[] as Array<Record<string,unknown>>,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:(projection:Record<string,unknown>)=>{
   const data=state.reads++===0?state.assignment:state.quizzes;
   state.projections.push(projection);
   const chain={
    from(){return chain;},
    innerJoin(_table:unknown,condition:unknown){state.joins.push(condition);return chain;},
    leftJoin(_table:unknown,condition:unknown){state.joins.push(condition);return chain;},
    where(condition:unknown){state.where.push(condition);return Promise.resolve(data);},
   };
   return chain;
  },
 }),
}));
import {listOwnLearnerAssessmentRows} from "@/modules/courses/learner-assessment-flat-query";

const now=Date.parse("2026-10-18T12:00:00.000Z");
const currentDelivery="11111111-1111-4111-8111-111111111111";
const membershipId="22222222-2222-4222-8222-222222222222";
const deliveries=[{deliveryId:currentDelivery,
 offeringId:"33333333-3333-4333-8333-333333333333",
 courseId:"44444444-4444-4444-8444-444444444444",courseName:"Networks",courseCode:"CS402",
}];
const sqlText=(value:unknown)=>new PgDialect().sqlToQuery(value as SQL).sql;
beforeEach(()=>{state.reads=0;state.projections=[];state.joins=[];state.where=[];
 state.assignment=[];state.quizzes=[];});
describe("COURSES7-SECTION-TRANSFER-12: one learner attempt quota and submission after a section switch",()=>{
 it("scopes assignment lookup to the learner and authorized shared item, never the old submission section",async()=>{
  state.assignment=[{
   deliveryId:currentDelivery,lessonId:"l",lessonName:"Week 1",id:"a",title:"A",
   description:null,dueAt:new Date(now+10000),createdAt:new Date(now-1000),
   maxPoints:10,sequence:1,submissionId:"old-section-receipt",
   submissionType:"TEXT",submissionText:"Submitted before promotion",
   submissionUrl:null,submittedAt:new Date(now-1000),gradePublished:false,
   pointsAwarded:9,feedback:"Not released",gradingStatus:"GRADED",
  }];
  const rows=await listOwnLearnerAssessmentRows(deliveries,membershipId,now);
  expect(rows.assignments[0].progress.status).toBe("COMPLETED");
  expect(rows.assignments[0].gradePublished).toBe(false);
  expect(rows.assignments[0].pointsAwarded).toBeNull();
  const assignmentJoin=state.joins.map(sqlText).find(text=>text.includes("assignment_submissions"));
  expect(assignmentJoin).toBeDefined();
  expect(assignmentJoin).toContain("assignment_id");
  expect(assignmentJoin).toContain("membership_id");
  expect(assignmentJoin).not.toContain("assignment_submissions\".\"delivery_id");
  expect(state.where.map(sqlText).join(" ")).toContain("course_section_deliveries");
 });
 it("counts a quiz attempt against the same learner's global quiz quota after transfer",async()=>{
  state.quizzes=[{
   deliveryId:currentDelivery,lessonId:"l",lessonName:"Week 1",id:"q",title:"Q",
   description:null,dueAt:new Date(now-1000),createdAt:new Date(now-10000),
   maxAttempts:2,totalPoints:10,sequence:1,status:"CLOSED",resultsPublished:false,
   attemptsUsed:2,firstSubmittedAt:new Date(now-4000),
  }];
  const rows=await listOwnLearnerAssessmentRows(deliveries,membershipId,now);
  expect(rows.quizzes[0]).toMatchObject({attemptsUsed:2,attemptsRemaining:0,resultsPublished:false});
  for(const key of ["attemptsUsed","firstSubmittedAt"]){
   const fragment=sqlText(state.projections[1][key]);
   expect(fragment).toContain("qa.quiz_id");
   expect(fragment).toContain("qa.membership_id");
   expect(fragment).not.toContain("qa.delivery_id");
  }
 });
 it("performs no database work without a server-authorized delivery",async()=>{
  expect(await listOwnLearnerAssessmentRows([],membershipId,now)).toEqual({assignments:[],quizzes:[]});
  expect(state.reads).toBe(0);
 });
});
