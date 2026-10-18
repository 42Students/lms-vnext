import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
 assignment:vi.fn(),access:vi.fn(),execute:vi.fn(),select:vi.fn(),
 links:[] as Array<{id:string;title:string;externalUrl:string;sequence:number}>,
}));
vi.mock("@/modules/courses/assignment-scope",()=>({loadCourseAssignmentScope:state.assignment}));
vi.mock("@/modules/courses/learning-access",()=>({
 requireLearningReadAccess:state.access,requireDeliveryContentMutation:vi.fn(),
}));
vi.mock("@/db/client",()=>({getDb:()=>({
 execute:state.execute,select:state.select,
})}));
import {listOwnLearnerAssignmentMaterialLinks} from "@/modules/courses/learner-assignment-materials-service";

const id="11111111-1111-4111-8111-111111111111";
const delivery="22222222-2222-4222-8222-222222222222";
const offering="33333333-3333-4333-8333-333333333333";
const ctx={} as RequestContext;
beforeEach(()=>{
 state.assignment.mockReset().mockResolvedValue({
  id,deliveryId:null,offeringId:offering,status:"PUBLISHED",
  learningPathStatus:"PUBLISHED",lessonVisibleToStudents:true,
 });
 state.access.mockReset().mockResolvedValue("LEARNER");
 state.execute.mockReset().mockResolvedValue([{ready:true}]);
 state.links=[{id:"mat-1",title:"Reference",externalUrl:"https://courses.example.edu/guide",sequence:0}];
 state.select.mockReset().mockImplementation(()=>({
  from(){return this;},where(){return this;},orderBy(){return this;},
  limit:async()=>state.links,
 }));
});
describe("LEARNER-ASSIGNMENT-MATERIALS-04 own published material service boundaries",()=>{
 it("rejects malformed assignment and Section IDs before assignment lookup or SQL",async()=>{
  await expect(listOwnLearnerAssignmentMaterialLinks(ctx,"not-uuid",delivery)).rejects.toThrow();
  await expect(listOwnLearnerAssignmentMaterialLinks(ctx,id,"bad-delivery")).rejects.toThrow();
  expect(state.assignment).not.toHaveBeenCalled();
  expect(state.execute).not.toHaveBeenCalled();
 });
 it("denies delivery-specific assignments when the requested Section differs",async()=>{
  state.assignment.mockResolvedValueOnce({id,deliveryId:id,offeringId:offering,
   status:"PUBLISHED",learningPathStatus:"PUBLISHED",lessonVisibleToStudents:true});
  await expect(listOwnLearnerAssignmentMaterialLinks(ctx,id,delivery)).rejects.toThrow();
  expect(state.access).not.toHaveBeenCalled();
  expect(state.execute).not.toHaveBeenCalled();
 });
 it("checks learner enrollment and published ancestry before probing optional material storage",async()=>{
  for(const change of [
   {status:"DRAFT"},{learningPathStatus:"DRAFT"},{lessonVisibleToStudents:false},
  ]){
   state.assignment.mockResolvedValueOnce({id,deliveryId:null,offeringId:offering,
    status:"PUBLISHED",learningPathStatus:"PUBLISHED",lessonVisibleToStudents:true,...change});
   await expect(listOwnLearnerAssignmentMaterialLinks(ctx,id,delivery)).rejects.toThrow();
  }
  state.access.mockRejectedValueOnce(Error("Enrollment revoked"));
  await expect(listOwnLearnerAssignmentMaterialLinks(ctx,id,delivery)).rejects.toThrow();
  expect(state.execute).not.toHaveBeenCalled();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("fails closed to an honest unavailable message when the material schema is not registered",async()=>{
  state.execute.mockResolvedValueOnce([{ready:false}]);
  expect(await listOwnLearnerAssignmentMaterialLinks(ctx,id,delivery))
   .toEqual({available:false,links:[]});
  expect(state.select).not.toHaveBeenCalled();
 });
 it("returns only HTTPS safe links after authorized Section lookup and drops stored legacy unsafe URLs",async()=>{
  state.links=[
   {id:"safe",title:"University Guide",externalUrl:"https://courses.example.edu/guide",sequence:0},
   {id:"legacy-http",title:"Old",externalUrl:"http://example.edu/unsecure",sequence:1},
   {id:"private",title:"Private",externalUrl:"https://user:secret@example.edu/",sequence:2},
   {id:"script",title:"Unsafe",externalUrl:"javascript:alert(1)",sequence:3},
  ];
  const result=await listOwnLearnerAssignmentMaterialLinks(ctx,id,delivery);
  expect(result).toEqual({available:true,links:[
   {id:"safe",title:"University Guide",href:"https://courses.example.edu/guide"},
  ]});
  expect(state.access).toHaveBeenCalledWith(ctx,offering,delivery);
  expect(state.select).toHaveBeenCalledTimes(1);
 });
});
