import {describe,expect,it} from "vitest";
import {mentorMeetingInAppNoticeFacts as facts}
  from "@/modules/projects/mentor-meeting-in-app-notice-model";
const project="11111111-1111-4111-8111-111111111111";
const m="22222222-2222-4222-8222-222222222222";
const event=(id:string,at:string,scope=project)=>({
 id,subjectId:m,occurredAt:new Date(at),metadata:{projectId:scope,meetingId:m},
});
describe("Mentor meeting saved in-app notice provenance",()=>{
 it("uses the most recent same-project announcement and its own recipient count",()=>{
  const old=event("a","2026-10-24T09:00:00.000Z");
  const recent=event("b","2026-10-24T10:00:00.000Z");
  expect(facts([old,recent],new Map([["a",4],["b",3]]),project)).toEqual([{
   meetingId:m,announcedAt:"2026-10-24T10:00:00.000Z",notifiedRecipients:3,
  }]);
 });
 it("denies foreign metadata and never fabricates saved recipients",()=>{
  const foreign=event("foreign","2026-10-24T12:00:00.000Z","foreign-project");
  const local=event("local","2026-10-24T11:00:00.000Z");
  expect(facts([foreign,local],new Map([["foreign",99]]),project)[0])
    .toMatchObject({notifiedRecipients:0,announcedAt:"2026-10-24T11:00:00.000Z"});
  expect(facts([foreign],new Map(),project)).toEqual([]);
 });
 it("does not mistake forged subject references for an announcement",()=>{
  expect(facts([{id:"x",subjectId:m,occurredAt:new Date(),
    metadata:{projectId:project,meetingId:"unrelated"}}],new Map([["x",9]]),project))
    .toEqual([]);
 });
});
