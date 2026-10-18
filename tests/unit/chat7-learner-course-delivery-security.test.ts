import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
 select:vi.fn(),primary:[] as unknown[],electiveRows:[] as unknown[],
 activeIds:vi.fn(),boundIds:vi.fn(),delivery:vi.fn(),learningAccess:vi.fn(),
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
vi.mock("@/modules/courses/scope",()=>({loadCourseSectionDeliveryScope:state.delivery}));
vi.mock("@/modules/courses/learning-access",()=>({requireLearningReadAccess:state.learningAccess}));
vi.mock("@/modules/groups/roster-access",()=>({
 listActiveElectiveDeliveryIds:state.activeIds,
 listBoundElectiveDeliveryIds:state.boundIds,
}));
import {listLearnerCourseDeliveries,listLearnerCourseInstructors} from "@/modules/courses/learner-course-service";

const context={user:{platformStatus:"ACTIVE"},membership:{
 id:"11111111-1111-4111-8111-111111111111",collegeId:"22222222-2222-4222-8222-222222222222",
 status:"ACTIVE",roles:["LEARNER"]}} as unknown as RequestContext;
const a={deliveryId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",courseName:"Core"};
const b={deliveryId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",courseName:"Elective"};
const c={deliveryId:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",courseName:"Learner group"};
beforeEach(()=>{
 state.select.mockReset();state.activeIds.mockReset();state.boundIds.mockReset();
 let call=0;
 state.select.mockImplementation(()=>{
  const current=call++===0?state.primary:state.electiveRows;
  return {from(){return this;},innerJoin(){return this;},leftJoin(){return this;},
   where(){return this;},orderBy(){return Promise.resolve(current);}};
 });
 state.primary=[a,b];state.electiveRows=[c];
 state.activeIds.mockResolvedValue([]);state.boundIds.mockResolvedValue([b.deliveryId]);
 state.delivery.mockReset().mockResolvedValue({offeringId:a.deliveryId});
 state.learningAccess.mockReset().mockResolvedValue("LEARNER");
});
describe("LEARNER-courses-roster-01 active course and elective ownership matrix",()=>{
 it("hides a host-section elective when learner lacks elective-group enrollment",async()=>{
  const rows=await listLearnerCourseDeliveries(context);
  expect(rows).toEqual([a]);
  expect(state.select).toHaveBeenCalledTimes(1);
  expect(state.activeIds).toHaveBeenCalledWith(context.membership?.id,context.membership?.collegeId);
 });
 it("includes only explicitly authorized group electives and never duplicates host-section visibility",async()=>{
  state.activeIds.mockResolvedValue([c.deliveryId]);
  const rows=await listLearnerCourseDeliveries(context);
  expect(rows).toEqual([a,c]);
  expect(state.select).toHaveBeenCalledTimes(2);
  expect(state.boundIds).toHaveBeenCalledWith([a.deliveryId,b.deliveryId]);
 });
 it("denies inactive actor, suspended membership and faculty-only role before any roster query",async()=>{
  for(const invalid of [
   {user:{platformStatus:"DISABLED"},membership:context.membership},
   {user:context.user,membership:{...context.membership,status:"DISABLED"}},
   {user:context.user,membership:{...context.membership,roles:["FACULTY"]}},
  ]){
   await expect(listLearnerCourseDeliveries(invalid as unknown as RequestContext)).rejects.toThrow();
  }
  expect(state.select).not.toHaveBeenCalled();
 });
 it("LEARNER-COURSE-INSTRUCTORS-01 prefers active authorized teaching staff to ended assignments",async()=>{
  state.primary=[
   {membershipId:"active",role:"PRIMARY",name:"Active Faculty",endedAt:null},
   {membershipId:"old",role:"SECONDARY",name:"Former Faculty",endedAt:new Date("2099-01-01T00:00:00Z")},
  ];
  expect(await listLearnerCourseInstructors(context,a.deliveryId)).toEqual([
   {membershipId:"active",role:"PRIMARY",name:"Active Faculty"},
  ]);
  expect(state.learningAccess).toHaveBeenCalledWith(context,a.deliveryId,a.deliveryId,{includeHistorical:true});
 });
 it("enforces exact offering cohort and period against persisted section and program rows",()=>{
  const src=readFileSync("src/modules/courses/learner-course-service.ts","utf8");
  for(const clause of [
   "eq(courseOfferings.cohortId,sections.cohortId)",
   "eq(courseOfferings.cohortId,learnerProgramEnrollments.cohortId)",
   "eq(courseOfferings.academicPeriodId,sectionEnrollments.academicPeriodId)",
   "eq(courseOfferings.academicPeriodId,sections.academicPeriodId)",
   "eq(sections.cohortId,courseOfferings.cohortId)",
   'eq(collegeMemberships.status,"ACTIVE")',
   'eq(users.platformStatus,"ACTIVE")',
   'eq(membershipRoles.role,"FACULTY")',
  ])expect(src).toContain(clause);
 });
});
