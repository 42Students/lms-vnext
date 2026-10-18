import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 scope:vi.fn(),
 access:vi.fn(),
 select:vi.fn(),
 rows:[] as Array<{methods:unknown}>,
}));
vi.mock("@/modules/courses/assignment-scope",()=>({loadCourseAssignmentScope:state.scope}));
vi.mock("@/modules/courses/learning-access",()=>({requireLearningReadAccess:state.access}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
import {getLearnerAssignmentMethods} from "@/modules/courses/learner-assignment-methods-service";
const id="11111111-1111-4111-8111-111111111111";
const delivery="22222222-2222-4222-8222-222222222222";
const offering="33333333-3333-4333-8333-333333333333";
const context={membership:{roles:["LEARNER"]}} as RequestContext;
beforeEach(()=>{
 state.scope.mockReset();state.access.mockReset();state.select.mockReset();
 state.scope.mockResolvedValue({status:"PUBLISHED",lessonVisibleToStudents:true,
  learningPathStatus:"PUBLISHED",deliveryId:null,offeringId:offering});
 state.access.mockResolvedValue("LEARNER");
 state.rows=[{methods:["WRITTEN_RESPONSE","EXTERNAL_LINK"]}];
 state.select.mockImplementation(()=>({from(){return this;},where(){return this;},
  limit:async()=>state.rows}));
});
describe("LEARNER-ASSIGNMENT-METHODS-01 published policy for an authorized learner",()=>{
 it("rejects malformed IDs before any course or database read",async()=>{
  await expect(getLearnerAssignmentMethods(context,"invalid",delivery)).rejects.toThrow();
  await expect(getLearnerAssignmentMethods(context,id,"invalid")).rejects.toThrow();
  expect(state.scope).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("denies draft, hidden, unpublished-path or different-delivery assignments",async()=>{
  for(const invalid of [
   {status:"DRAFT"},{lessonVisibleToStudents:false},
   {learningPathStatus:"DRAFT"},{deliveryId:id},
  ]){
   state.scope.mockResolvedValueOnce({status:"PUBLISHED",lessonVisibleToStudents:true,
    learningPathStatus:"PUBLISHED",deliveryId:null,offeringId:offering,...invalid});
   await expect(getLearnerAssignmentMethods(context,id,delivery)).rejects.toThrow();
  }
  expect(state.access).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("denies the wrong role even when an offering exists",async()=>{
  state.access.mockResolvedValue("FACULTY");
  await expect(getLearnerAssignmentMethods(context,id,delivery)).rejects.toThrow();
  state.access.mockResolvedValue("LEARNER");
  await expect(getLearnerAssignmentMethods({membership:{roles:["MENTOR"]}} as RequestContext,id,delivery)).rejects.toThrow();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("returns exactly the live authored methods after scoped delivery authorization",async()=>{
  const result=await getLearnerAssignmentMethods(context,id,delivery);
  expect(result).toEqual(["WRITTEN_RESPONSE","EXTERNAL_LINK"]);
  expect(state.access).toHaveBeenCalledWith(context,offering,delivery);
  expect(state.select).toHaveBeenCalledTimes(1);
 });
 it("rejects a disappearing assignment after access check rather than pretending defaults are saved",async()=>{
  state.rows=[];
  await expect(getLearnerAssignmentMethods(context,id,delivery)).rejects.toThrow();
 });
});
