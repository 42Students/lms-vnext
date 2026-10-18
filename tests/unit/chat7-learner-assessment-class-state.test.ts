import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
 guard:vi.fn(),deliveries:vi.fn(),rows:vi.fn(),select:vi.fn(),
 classRows:[] as Array<{id:string}>,classReadFails:false,
}));
vi.mock("@/modules/courses/learner-access-guard",()=>({requireOwnCourseLearnerRead:state.guard}));
vi.mock("@/modules/courses/learner-course-service",()=>({listLearnerCourseDeliveries:state.deliveries}));
vi.mock("@/modules/courses/learner-assessment-flat-query",()=>({listOwnLearnerAssessmentRows:state.rows}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {getLearnerAssessmentOverview} from "@/modules/courses/learner-assessment-service";
const courseId="11111111-1111-4111-8111-111111111111";
const deliveryId="22222222-2222-4222-8222-222222222222";
const memberId="33333333-3333-4333-8333-333333333333";
const context={user:{id:"44444444-4444-4444-8444-444444444444",platformStatus:"ACTIVE"},
 membership:{id:memberId,roles:["LEARNER"],status:"ACTIVE"}} as unknown as RequestContext;
const item={deliveryId,courseId,courseName:"Operating Systems",courseCode:"CS101"};
beforeEach(()=>{
 state.guard.mockReset().mockResolvedValue(context.membership);
 state.deliveries.mockReset().mockResolvedValue([item]);
 state.rows.mockReset().mockResolvedValue({assignments:[],quizzes:[]});
 state.select.mockReset();
 state.classRows=[{id:"enrollment"}];state.classReadFails=false;
 state.select.mockImplementation(()=>({from(){return this;},innerJoin(){return this;},
  where(){return this;},limit:async()=>{
   if(state.classReadFails)throw Error("Database unavailable");
   return state.classRows;
  }}));
});
describe("LEARNER-ASSESSMENTS-CLASS-01 truthful class and scoped assessments",()=>{
 it("does not label a learner with no published courses as having no class when current Section exists",async()=>{
  state.deliveries.mockResolvedValue([]);
  const result=await getLearnerAssessmentOverview(context);
  expect(result.classScope).toBe("PRESENT");
  expect(result.assignments).toEqual([]);
  expect(result.quizzes).toEqual([]);
  expect(state.rows).toHaveBeenCalledWith([],memberId,expect.any(Number));
 });
 it("distinguishes unavailable class lookup from an actual no-class result",async()=>{
  state.classReadFails=true;
  expect((await getLearnerAssessmentOverview(context)).classScope).toBe("UNAVAILABLE");
  state.classReadFails=false;state.classRows=[];
  expect((await getLearnerAssessmentOverview(context)).classScope).toBe("NONE");
 });
 it("never calls course/assessment services after denied persisted actor guard",async()=>{
  state.guard.mockRejectedValueOnce(Error("revoked"));
  await expect(getLearnerAssessmentOverview(context)).rejects.toThrow();
  expect(state.deliveries).not.toHaveBeenCalled();
  expect(state.rows).not.toHaveBeenCalled();
 });
 it("only narrows reads to the roster-authorized course ID and sorts deadlines, then title",async()=>{
  const old=new Date("2099-01-01T00:00:00Z");
  const future=new Date("2099-01-02T00:00:00Z");
  state.rows.mockResolvedValue({
   assignments:[{title:"B",dueAt:future},{title:"Z",dueAt:old},{title:"A",dueAt:future}],
   quizzes:[{title:"No deadline",dueAt:null},{title:"Due",dueAt:future}],
  });
  const result=await getLearnerAssessmentOverview(context,{courseId});
  expect(result.selectedCourseId).toBe(courseId);
  expect(result.assignments.map(x=>x.title)).toEqual(["Z","A","B"]);
  expect(result.quizzes.map(x=>x.title)).toEqual(["Due","No deadline"]);
  expect(state.rows).toHaveBeenCalledWith([item],memberId,expect.any(Number));
 });
 it("LEARNER-ASSESSMENTS-FILTER-01 refuses forged or malformed course filters instead of broadening to all courses",async()=>{
  for(const invalid of [
   "55555555-5555-4555-8555-555555555555",
   "not-a-uuid",
   [courseId,courseId],
  ]){
   state.rows.mockClear();
   await expect(getLearnerAssessmentOverview(context,{courseId:invalid})).rejects.toThrow();
   expect(state.rows).not.toHaveBeenCalled();
  }
  const all=await getLearnerAssessmentOverview(context,{courseId:""});
  expect(all.selectedCourseId).toBeNull();
  expect(state.rows).toHaveBeenCalledWith([item],memberId,expect.any(Number));
 });
 it("enforces ACTIVE Section status with exact cohort and academic period for the class-present probe",()=>{
  const src=readFileSync("src/modules/courses/learner-assessment-service.ts","utf8");
  for(const clause of [
   'eq(sections.status,"ACTIVE")',
   'eq(sections.cohortId,learnerProgramEnrollments.cohortId)',
   'eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId)',
   'eq(learnerProgramEnrollments.status,"ACTIVE")',
   'eq(sectionEnrollments.status,"ACTIVE")',
  ])expect(src).toContain(clause);
 });
});
