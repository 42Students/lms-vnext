import {describe,expect,it} from "vitest";
import {
 facultyCourseHealthParamsSchema,
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
 it("rejects invalid Section IDs, extra tenant selectors and impossible paging",()=>{
  for(const query of [
   {deliveryId:"bad"},
   {deliveryId,collegeId:foreign},
   {deliveryId,page:0},
   {deliveryId,kind:"ARCHIVED"},
  ])expect(facultyCourseHealthParamsSchema.safeParse(query).success).toBe(false);
 });
});
