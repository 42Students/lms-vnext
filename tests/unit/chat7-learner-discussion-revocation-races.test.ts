import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
 access:vi.fn(),delivery:vi.fn(),actor:vi.fn(),event:vi.fn(),
 current:vi.fn(),txSelect:vi.fn(),txInsert:vi.fn(),txDelete:vi.fn(),
 live:true,dbMessage:null as null|{id:string;deliveryId:string;senderMembershipId:string;pinned:boolean;updatedAt:Date},
}));
vi.mock("@/modules/courses/learning-access",()=>({requireLearningReadAccess:state.access}));
vi.mock("@/modules/courses/scope",()=>({loadCourseSectionDeliveryScope:state.delivery}));
vi.mock("@/modules/courses/learner-access-guard",()=>({requireOwnCourseLearnerRead:state.actor}));
vi.mock("@/modules/activity/service",()=>({recordActivityEventInTransaction:state.event}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:state.current,
  transaction:async(callback:(tx:unknown)=>Promise<unknown>)=>{
   const tx={
    select:state.txSelect,
    insert:state.txInsert,
    delete:state.txDelete,
   };
   return callback(tx);
  },
 }),
}));
import {createCourseDiscussionMessage,deleteCourseDiscussionMessage} from "@/modules/courses/discussion-service";

const memberId="11111111-1111-4111-8111-111111111111";
const deliveryId="22222222-2222-4222-8222-222222222222";
const messageId="33333333-3333-4333-8333-333333333333";
const userId="44444444-4444-4444-8444-444444444444";
const context={
 user:{id:userId,platformStatus:"ACTIVE"},
 membership:{id:memberId,status:"ACTIVE",collegeId:"55555555-5555-4555-8555-555555555555",
  organizationId:"66666666-6666-4666-8666-666666666666",roles:["LEARNER"]},
} as unknown as RequestContext;
function query(rows:()=>unknown[]){
 return {from(){return this;},innerJoin(){return this;},where(){return this;},
  for(){return this;},limit:async()=>rows()};
}
beforeEach(()=>{
 state.live=true;
 state.access.mockReset().mockResolvedValue("LEARNER");
 state.delivery.mockReset().mockResolvedValue({id:deliveryId,offeringId:"77777777-7777-4777-8777-777777777777"});
 state.actor.mockReset().mockResolvedValue(context.membership);
 state.event.mockReset().mockResolvedValue(undefined);
 state.current.mockReset().mockImplementation(()=>query(()=>state.dbMessage?[state.dbMessage]:[]));
 state.txSelect.mockReset().mockImplementation(()=>query(()=>state.live?[{id:memberId}]:[]));
 state.txInsert.mockReset().mockImplementation(()=>({values(){return this;},returning:async()=>[{id:messageId}]}));
 state.txDelete.mockReset().mockImplementation(()=>({where(){return this;},returning:async()=>[{id:messageId}]}));
 state.dbMessage={id:messageId,deliveryId,senderMembershipId:memberId,pinned:false,
  updatedAt:new Date("2099-01-01T00:00:00Z")};
});
describe("LEARNER-DISCUSSIONS-RACE-01 recheck learner role at write commit",()=>{
 it("refuses a revoked learner after preflight but before insert, with no event or write",async()=>{
  state.live=false;
  await expect(createCourseDiscussionMessage(context,deliveryId,{messageText:"Question"})).rejects.toThrow();
  expect(state.txSelect).toHaveBeenCalledTimes(1);
  expect(state.txInsert).not.toHaveBeenCalled();
  expect(state.event).not.toHaveBeenCalled();
 });
 it("persists an active learner post and its activity within the same transaction",async()=>{
  const message=await createCourseDiscussionMessage(context,deliveryId,{messageText:"Question"});
  expect(message.id).toBe(messageId);
  expect(state.txSelect).toHaveBeenCalledTimes(1);
  expect(state.txInsert).toHaveBeenCalledTimes(1);
  expect(state.event).toHaveBeenCalledTimes(1);
 });
 it("refuses deletion after a concurrent learner membership or role revocation",async()=>{
  state.live=false;
  await expect(deleteCourseDiscussionMessage(context,messageId,deliveryId)).rejects.toThrow();
  expect(state.txSelect).toHaveBeenCalledTimes(1);
  expect(state.txDelete).not.toHaveBeenCalled();
  expect(state.event).not.toHaveBeenCalled();
 });
 it("allows own unpinned post deletion only with the locked active learner grant",async()=>{
  const result=await deleteCourseDiscussionMessage(context,messageId,deliveryId);
  expect(result.id).toBe(messageId);
  expect(state.txSelect).toHaveBeenCalledTimes(1);
  expect(state.txDelete).toHaveBeenCalledTimes(1);
  expect(state.event).toHaveBeenCalledTimes(1);
 });
 it("rejects malformed posting payload before opening a write transaction",async()=>{
  await expect(createCourseDiscussionMessage(context,deliveryId,{messageText:"",admin:true})).rejects.toThrow();
  expect(state.txSelect).not.toHaveBeenCalled();
  expect(state.txInsert).not.toHaveBeenCalled();
 });
});
