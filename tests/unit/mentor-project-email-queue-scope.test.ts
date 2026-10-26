import {describe,expect,it} from "vitest";
import {mentorEmailQueueMatchesSource} from
 "@/modules/projects/mentor-project-email-event-model";

const projectId="11111111-1111-4111-8111-111111111111";
const source={
 collegeId:"22222222-2222-4222-8222-222222222222",
 organizationId:"33333333-3333-4333-8333-333333333333",
 projectId,kind:"FINAL_SUBMISSION" as const,
};
describe("Mentor email queue/source tenant and workflow link",()=>{
 it("accepts only the exact outbox scope committed with the source event",()=>{
  expect(mentorEmailQueueMatchesSource(source,source)).toBe(true);
 });
 it("rejects cross-college and cross-organization source swaps",()=>{
  for(const changed of [
   {...source,collegeId:"44444444-4444-4444-8444-444444444444"},
   {...source,organizationId:"55555555-5555-4555-8555-555555555555"},
   {...source,collegeId:null},{...source,organizationId:null},
  ]){
   expect(mentorEmailQueueMatchesSource(changed,source)).toBe(false);
  }
 });
 it("rejects a changed project or event kind even in the same college",()=>{
  for(const changed of [
   {...source,projectId:"66666666-6666-4666-8666-666666666666"},
   {...source,kind:"MEETING_REQUEST"},
   {...source,projectId:undefined},{...source,kind:undefined},
  ]){
   expect(mentorEmailQueueMatchesSource(changed,source)).toBe(false);
  }
 });
 it("binds meeting request email intents to the meeting-request event",()=>{
  const meeting={...source,kind:"MEETING_REQUEST" as const};
  expect(mentorEmailQueueMatchesSource(meeting,meeting)).toBe(true);
  expect(mentorEmailQueueMatchesSource(source,meeting)).toBe(false);
 });
});
