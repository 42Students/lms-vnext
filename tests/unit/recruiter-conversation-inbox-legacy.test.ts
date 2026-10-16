import {describe,expect,it} from "vitest";
import {filterRecruiterConversations,recruiterMessageRelativeTime} from "@/modules/placements/hr-conversation-inbox-model";
describe("REC-calendar-messages-profile-09, REC-calendar-messages-profile-10 inbox legacy copy/search",()=>{
 const threads=[{id:"id1",jobId:"job1"},{id:"id2",jobId:null},{id:"id3",jobId:"foreign"}];
 it("searches scoped latest message text and the job title, never foreign drives",()=>{
  const result=filterRecruiterConversations(threads,new Set(["job1"]),"interview",
   new Map([["job1","Developer"]]),new Map([["id1","Interview confirmed"],["id3","Interview private"]]));
  expect(result.map(t=>t.id)).toEqual(["id1"]);
  expect(filterRecruiterConversations(threads,new Set(["job1"]),"developer",new Map([["job1","Developer"]]))
   .map(t=>t.id)).toEqual(["id1"]);
 });
 it("shows legacy-style relative update and empty labels",()=>{
  const now=new Date("2026-10-17T12:00:00Z");
  expect(recruiterMessageRelativeTime(null,now)).toBe("No messages yet");
  expect(recruiterMessageRelativeTime(new Date("2026-10-17T11:00:00Z"),now)).toBe("an hour ago");
  expect(recruiterMessageRelativeTime(new Date("2026-10-17T10:00:00Z"),now)).toBe("2 hours ago");
 });
});
