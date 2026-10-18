import {describe,expect,it} from "vitest";
import {learnerVisibleContentExternalUrl} from "@/modules/courses/learner-live-link-availability-model";
import {learnerSafeExternalContentHref} from "@/modules/courses/learner-external-content-link-model";
import {resumePositionForGrant,playbackGrantRefreshDelay} from "@/modules/courses/learner-video-grant-model";
import {learnerDueSoonNotices} from "@/modules/courses/learner-assignment-due-notice-model";
import {learnerDiscussionDraftValid,LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH} from "@/modules/courses/learner-discussion-message-limit-model";

const now=new Date("2099-01-01T00:00:00.000Z");
describe("Learner media, deadlines and discussion recovery boundaries",()=>{
 it("LEARNER-LIVE-LINK-01 permits an upcoming meeting but hides ended and unsafe legacy links",()=>{
  expect(learnerVisibleContentExternalUrl({contentType:"LIVE_CLASS",availability:"SCHEDULED",
   externalUrl:"https://meet.example.edu/join"})).toBe("https://meet.example.edu/join");
  expect(learnerVisibleContentExternalUrl({contentType:"LIVE_CLASS",availability:"ENDED",
   externalUrl:"https://meet.example.edu/join"})).toBeNull();
  expect(learnerVisibleContentExternalUrl({contentType:"VIDEO",availability:"SCHEDULED",
   externalUrl:"https://example.edu/lesson"})).toBeNull();
  for(const unsafe of ["javascript:alert(1)","data:text/html,evil",
   "https://staff:password@college.edu/","file:///etc/passwd"]){
   expect(learnerVisibleContentExternalUrl({contentType:"LIVE_CLASS",availability:"AVAILABLE",
    externalUrl:unsafe})).toBeNull();
   expect(learnerSafeExternalContentHref(unsafe)).toBeNull();
  }
 });
 it("LEARNER-VIDEO-GRANT-01 bounds invalid playback positions and renews before expiry",()=>{
  expect(resumePositionForGrant(-10,44,20,false)).toBe(44);
  expect(resumePositionForGrant(15,44,20,true)).toBe(15);
  expect(resumePositionForGrant(Number.NaN,0,0,true)).toBe(0);
  expect(playbackGrantRefreshDelay(new Date(now.getTime()+40_000).toISOString(),now.getTime())).toBe(10_000);
  expect(playbackGrantRefreshDelay(new Date(now.getTime()+10_000).toISOString(),now.getTime())).toBe(1_000);
  expect(playbackGrantRefreshDelay(now.toISOString(),now.getTime())).toBe(0);
  expect(playbackGrantRefreshDelay("invalid",now.getTime())).toBe(0);
 });
 it("LEARNER-ASSIGNMENT-REMINDER-01 excludes submitted/expired rows and deduplicates by assignment plus Section",()=>{
  const later=new Date(now.getTime()+12*3_600_000);
  const deadline=new Date(now.getTime()+48*3_600_000);
  const rows=[
   {id:"a",title:"Essay",deliveryId:"section-1",dueAt:later,submissionId:null},
   {id:"a",title:"Essay",deliveryId:"section-1",dueAt:later,submissionId:null},
   {id:"a",title:"Essay",deliveryId:"section-2",dueAt:deadline,submissionId:null},
   {id:"b",title:"Submitted",deliveryId:"section-1",dueAt:later,submissionId:"done"},
   {id:"c",title:"Expired",deliveryId:"section-1",dueAt:now,submissionId:null},
   {id:"d",title:"No deadline",deliveryId:"section-1",dueAt:null,submissionId:null},
  ];
  const notices=learnerDueSoonNotices(rows,now);
  expect(notices.map(x=>x.key)).toEqual(["a:section-1","a:section-2"]);
  expect(notices.every(n=>n.title==="Assignment due soon")).toBe(true);
  expect(notices.every(n=>n.href.startsWith("/learn/allAssignments/"))).toBe(true);
  expect(learnerDueSoonNotices(rows,now,0)).toEqual([]);
 });
 it("LEARNER-DISCUSSION-LIMIT-01 rejects blank and overlong messages while preserving valid length",()=>{
  expect(learnerDiscussionDraftValid("   ")).toBe(false);
  expect(learnerDiscussionDraftValid(" Hello ")).toBe(true);
  expect(learnerDiscussionDraftValid("a".repeat(LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH))).toBe(true);
  expect(learnerDiscussionDraftValid("a".repeat(LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH+1))).toBe(false);
 });
});
