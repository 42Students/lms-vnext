import {describe,expect,it} from "vitest";
import {learnerDiscussionScopeKey} from "@/modules/courses/learner-discussion-scope-key-model";
import {learnerDiscussionMayPost} from "@/modules/courses/learner-discussion-submit-guard-model";
import {learnerDiscussionCanPost} from "@/modules/courses/learner-discussion-capability-model";
import {learnerDiscussionDraftValid,LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH} from "@/modules/courses/learner-discussion-message-limit-model";
import {learnerDiscussionRefreshIsCurrent} from "@/modules/courses/learner-discussion-refresh-order-model";
import {learnerDiscussionListResponse} from "@/modules/courses/learner-discussion-response-model";

const deliveryId="11111111-1111-4111-8111-111111111111";
const foreignDelivery="22222222-2222-4222-8222-222222222222";
describe("COURSES7-11 Learner discussion access and response isolation",()=>{
 it("COURSES7-11 switches the whole discussion component identity when authorized delivery changes",()=>{
  expect(learnerDiscussionScopeKey(deliveryId)).toBe(deliveryId);
  expect(learnerDiscussionScopeKey(foreignDelivery)).not.toBe(learnerDiscussionScopeKey(deliveryId));
  for(const invalid of ["","other-college","../user","11111111-1111-1111-1111-111111111111"]){
   expect(()=>learnerDiscussionScopeKey(invalid)).toThrow();
  }
 });
 it("COURSES7-11 explicit boolean true is the only permission enabling the editor",()=>{
  expect(learnerDiscussionCanPost(true)).toBe(true);
  for(const value of [null,undefined,false,0,1,"true",{},[],new Boolean(true)]){
   expect(learnerDiscussionCanPost(value)).toBe(false);
  }
 });
 it("COURSES7-11 guards repeated submit events and whitespace-only messages",()=>{
  expect(learnerDiscussionMayPost("Thank you",true,false)).toBe(true);
  for(const draft of [""," ","\t\n"]){
   expect(learnerDiscussionMayPost(draft,true,false)).toBe(false);
  }
  expect(learnerDiscussionMayPost("Hello",false,false)).toBe(false);
  expect(learnerDiscussionMayPost("Hello",true,true)).toBe(false);
  expect(learnerDiscussionMayPost("x".repeat(3901),true,false)).toBe(false);
 });
 it("COURSES7-11 enforces the same finite message length used for all persisted writers",()=>{
  expect(LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH).toBe(3900);
  expect(learnerDiscussionDraftValid(" x ")).toBe(true);
  expect(learnerDiscussionDraftValid("x".repeat(3900))).toBe(true);
  expect(learnerDiscussionDraftValid("x".repeat(3901))).toBe(false);
  expect(learnerDiscussionDraftValid("   ")).toBe(false);
 });
 it("COURSES7-11 concurrent stale list refresh cannot replace a newer authorized message snapshot",()=>{
  expect(learnerDiscussionRefreshIsCurrent(2,2)).toBe(true);
  for(const [received,latest] of [[1,2],[3,2],[0,0],[-1,-1],[1.5,1.5],[NaN,NaN],[Infinity,Infinity]]){
   expect(learnerDiscussionRefreshIsCurrent(received,latest)).toBe(false);
  }
 });
 it("COURSES7-11 keeps authorized pinned messages and paging cursor without forwarding internal fields",()=>{
  const messages=[{id:"page-message",body:"Public message"}];
  const highlightedPinned=[{id:"pinned",body:"Outside this page"}];
  const nextCursor="cursor-from-server";
  const visible=learnerDiscussionListResponse({
   accessMode:"LEARNER",canPost:true,messages,highlightedPinned,nextCursor,
   privateEmail:"do-not-disclose",internalModerationNotes:"secret",
  });
  expect(visible).toEqual({accessMode:"LEARNER",canPost:true,
   messages,highlightedPinned,nextCursor});
  expect(visible).not.toHaveProperty("privateEmail");
  expect(visible).not.toHaveProperty("internalModerationNotes");
 });
});
