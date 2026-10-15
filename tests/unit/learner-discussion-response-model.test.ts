import {describe,expect,it} from "vitest";
import {learnerDiscussionListResponse} from "@/modules/courses/learner-discussion-response-model";
describe("authorized learner discussion response",()=>{
 it("preserves a pinned message outside the newest page without expanding that page",()=>{
  const pinned={id:"older",messageText:"Pinned from last semester"};
  const result=learnerDiscussionListResponse({
   accessMode:"LEARNER",canPost:false,messages:[{id:"new"}],
   highlightedPinned:pinned,nextCursor:{beforeId:"oldest"},
  });
  expect(result.highlightedPinned).toEqual(pinned);
  expect(result.messages).toHaveLength(1);
  expect(result.canPost).toBe(false);
 });
 it("keeps an absent pin explicitly null",()=>{
  expect(learnerDiscussionListResponse({
   accessMode:"LEARNER",canPost:true,messages:[],highlightedPinned:null,nextCursor:null,
  }).highlightedPinned).toBeNull();
 });
});
