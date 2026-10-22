import {describe,expect,it} from "vitest";
import {learnerDiscussionCanPost} from "@/modules/courses/learner-discussion-capability-model";
import {createLearnerDiscussionHistoryFlight} from "@/modules/courses/learner-discussion-history-flight-model";
import {learnerDiscussionDraftValid,LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH} from "@/modules/courses/learner-discussion-message-limit-model";
import {learnerDiscussionRefreshIsCurrent} from "@/modules/courses/learner-discussion-refresh-order-model";
import {formatDiscussionReply} from "@/modules/courses/learner-discussion-reply-model";
import {learnerDiscussionListResponse} from "@/modules/courses/learner-discussion-response-model";
import {learnerDiscussionScopeKey} from "@/modules/courses/learner-discussion-scope-key-model";
import {learnerDiscussionTimeLabel,learnerDiscussionRelativeTimeLabel} from "@/modules/courses/learner-discussion-time-model";
import {readFileSync} from "node:fs";

describe("chat-7 learner course Discussion capability and concurrency",()=>{
 it("UX-learn-discussion-capability-01 fails closed absent, malformed and string-valued role claims",()=>{
  expect(learnerDiscussionCanPost(true)).toBe(true);
  for(const value of [false,null,undefined,0,1,"true",{canPost:true}]){
   expect(learnerDiscussionCanPost(value)).toBe(false);
  }
 });
 it("UX-learn-discussion-paging-02 blocks overlapping load-more requests and unlocks on failure",()=>{
  const lock=createLearnerDiscussionHistoryFlight();
  expect(lock.isBusy()).toBe(false);
  expect(lock.begin()).toBe(true);
  expect(lock.isBusy()).toBe(true);
  expect(lock.begin()).toBe(false);
  lock.end();
  expect(lock.isBusy()).toBe(false);
  expect(lock.begin()).toBe(true);
 });
 it("UX-learn-discussion-limit-03 bounds persisted text at 4000 characters, rejecting whitespace-only input",()=>{
  expect(LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH).toBe(4000);
  expect(learnerDiscussionDraftValid("  Good question  ")).toBe(true);
  expect(learnerDiscussionDraftValid("")).toBe(false);
  expect(learnerDiscussionDraftValid("   ")).toBe(false);
  expect(learnerDiscussionDraftValid("x".repeat(4000))).toBe(true);
  expect(learnerDiscussionDraftValid("x".repeat(4001))).toBe(false);
  expect(learnerDiscussionDraftValid(" "+ "x".repeat(4000)+" ")).toBe(true);
 });
 it("UX-learn-discussion-race-04 only accepts the latest positive safe refresh token",()=>{
  expect(learnerDiscussionRefreshIsCurrent(4,4)).toBe(true);
  expect(learnerDiscussionRefreshIsCurrent(3,4)).toBe(false);
  expect(learnerDiscussionRefreshIsCurrent(5,4)).toBe(false);
  expect(learnerDiscussionRefreshIsCurrent(0,0)).toBe(false);
  expect(learnerDiscussionRefreshIsCurrent(-1,-1)).toBe(false);
  expect(learnerDiscussionRefreshIsCurrent(1.1,1.1)).toBe(false);
  expect(learnerDiscussionRefreshIsCurrent(Number.MAX_SAFE_INTEGER+1,Number.MAX_SAFE_INTEGER+1)).toBe(false);
 });
 it("UX-learn-discussion-reply-05 annotates replies without changing persisted message schema",()=>{
  const parent="a5b699ff-0123-4123-8123-123456789123";
  expect(formatDiscussionReply("Thanks",parent)).toBe("↳ Reply to a5b699ff: Thanks");
  expect(formatDiscussionReply("Top level",null)).toBe("Top level");
 });
 it("UX-learn-discussion-response-06 preserves current authorized message/pin paging payload without leaking extra properties",()=>{
  const messages=[{id:"a",text:"hello"}],pins=[{id:"b",text:"important"}];
  const got=learnerDiscussionListResponse({
   accessMode:"POST",canPost:true,messages,highlightedPinned:pins,nextCursor:"next",
   internalKey:"do-not-expose",
  });
  expect(got).toEqual({accessMode:"POST",canPost:true,messages,highlightedPinned:pins,nextCursor:"next"});
  expect(got).not.toHaveProperty("internalKey");
  expect(got.messages).toBe(messages);
  expect(got.highlightedPinned).toBe(pins);
 });
 it("UX-learn-discussion-scope-07 requires a valid delivery UUID to prevent carrying another course's messages",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  expect(learnerDiscussionScopeKey(id)).toBe(id);
  for(const wrong of ["","not-uuid","../../other-course"]){
   expect(()=>learnerDiscussionScopeKey(wrong)).toThrow();
  }
 });
 it("UX-learn-discussion-time-08 formats IST, handles invalid values and preserves relative-time boundaries",()=>{
  const instant="2099-03-01T12:00:00.000Z",t=Date.parse(instant);
  expect(learnerDiscussionTimeLabel(instant)).toContain("IST");
  expect(learnerDiscussionTimeLabel("invalid")).toBe("Time unavailable");
  expect(learnerDiscussionRelativeTimeLabel(instant,t)).toBe("Just now");
  expect(learnerDiscussionRelativeTimeLabel(instant,t+59*60_000)).toBe("59m ago");
  expect(learnerDiscussionRelativeTimeLabel(instant,t+60*60_000)).toBe("1h ago");
  expect(learnerDiscussionRelativeTimeLabel(instant,t+24*60*60_000)).toBe("1d ago");
  expect(learnerDiscussionRelativeTimeLabel(instant,t+7*24*60*60_000)).toContain("IST");
  expect(learnerDiscussionRelativeTimeLabel(instant,t-1)).toContain("IST");
 });
 it("UX-learn-discussion-screen-09 wires capability, anti-race, reply, paging and empty/access semantics in actual reader",()=>{
  const component=readFileSync(new URL("../../src/components/courses/learner-course-discussion.tsx",import.meta.url),"utf8");
  for(const token of ["learnerDiscussionCanPost","learnerDiscussionDraftValid","learnerDiscussionRefreshIsCurrent","learnerDiscussionMayPost"]){
   expect(component).toContain(token);
  }
  expect(component).toContain("aria-");
 });
});
