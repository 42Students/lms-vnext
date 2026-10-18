import {describe,expect,it} from "vitest";
import {
 facultyCourseHealthParamsSchema,
 responseCoverage,
 selectFacultyCourseHealthCandidates,
} from "@/modules/courses/faculty-course-health-model";

const deliveryId="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
const dueAt=new Date("2099-01-01T12:00:00.000Z");
const row=(id:string,kind:"ASSIGNMENT"|"QUIZ",status:string,
 delivery=deliveryId)=>({id,deliveryId:delivery,title:id,kind,status,dueAt});

describe("FAC-HEALTH-CLOSED-02 Faculty assessment lifecycle reporting",()=>{
 it("shows published assignments and closed or published quizzes, but no draft/archived evidence",()=>{
  const records=[
   row("assignment-live","ASSIGNMENT","PUBLISHED"),
   row("assignment-closed","ASSIGNMENT","CLOSED"),
   row("quiz-closed","QUIZ","CLOSED"),
   row("quiz-live","QUIZ","PUBLISHED"),
   row("quiz-draft","QUIZ","DRAFT"),
   row("quiz-archived","QUIZ","ARCHIVED"),
   row("foreign-quiz","QUIZ","CLOSED",foreign),
  ];
  const query=facultyCourseHealthParamsSchema.parse({deliveryId});
  const result=selectFacultyCourseHealthCandidates(records,query);
  expect(result.total).toBe(3);
  expect(result.items.map(item=>item.id).sort())
   .toEqual(["assignment-live","quiz-closed","quiz-live"]);
  expect(records).toHaveLength(7);
 });
 it("keeps quiz-only and assignment-only filters scoped to the same delivery",()=>{
  const records=[row("closed-quiz","QUIZ","CLOSED"),
   row("published-assignment","ASSIGNMENT","PUBLISHED"),
   row("foreign-closed","QUIZ","CLOSED",foreign)];
  const quizzes=selectFacultyCourseHealthCandidates(records,
   facultyCourseHealthParamsSchema.parse({deliveryId,kind:"QUIZ"}));
  expect(quizzes.items.map(item=>item.id)).toEqual(["closed-quiz"]);
  const assignments=selectFacultyCourseHealthCandidates(records,
   facultyCourseHealthParamsSchema.parse({deliveryId,kind:"ASSIGNMENT"}));
  expect(assignments.items.map(item=>item.id)).toEqual(["published-assignment"]);
 });
 it("clamps stale deep links, caps expanded reports at five and keeps zero-result page stable",()=>{
  const rows=Array.from({length:12},(_,i)=>row("quiz-"+i,"QUIZ","CLOSED"));
  const query=facultyCourseHealthParamsSchema.parse({deliveryId,page:999});
  const result=selectFacultyCourseHealthCandidates(rows,query);
  expect(result).toMatchObject({page:3,total:12,totalPages:3,pageSize:5});
  expect(result.items).toHaveLength(2);
  const empty=selectFacultyCourseHealthCandidates([],
   facultyCourseHealthParamsSchema.parse({deliveryId,page:999}));
  expect(empty).toMatchObject({page:1,total:0,totalPages:1,items:[]});
 });
 it("FAC-HEALTH-RATE-03 reports unknown instead of invented scores for invalid counts",()=>{
  expect(responseCoverage(20,10)).toBe(50);
  expect(responseCoverage(20,0)).toBe(0);
  expect(responseCoverage(20,20)).toBe(100);
  for(const [eligible,responded] of [
    [0,0],[-1,0],[20,-1],[20,21],[20.5,10],
    [20,1.5],[Number.POSITIVE_INFINITY,10],[20,Number.NaN],
    [20,Number.NEGATIVE_INFINITY],
  ])expect(responseCoverage(eligible,responded)).toBeNull();
 });
 it("rejects invalid Section IDs, extra tenant selectors and impossible paging",()=>{
  for(const query of [
   {deliveryId:"bad"},
   {deliveryId,collegeId:foreign},
   {deliveryId,page:0},
   {deliveryId,kind:"ARCHIVED"},
  ])expect(facultyCourseHealthParamsSchema.safeParse(query).success).toBe(false);
 });
});
