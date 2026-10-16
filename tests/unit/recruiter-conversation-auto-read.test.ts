import {describe,expect,it} from "vitest";
import {recruiterConversationAcknowledged} from "@/modules/placements/recruiter-conversation-auto-read-model";
describe("REC-calendar-messages-profile-14 read-on-open POST verification",()=>{
 const base={threadId:"550e8400-e29b-41d4-a716-446655440000",
  status:200,redirected:true,redirectPath:"/hr/conversations/550e8400-e29b-41d4-a716-446655440000"};
 it("accepts the exact confirmed acknowledgement redirect",()=>{
  expect(recruiterConversationAcknowledged(base)).toBe(true);
 });
 it("rejects an auth redirect, errors and a wrong thread",()=>{
  expect(recruiterConversationAcknowledged({...base,status:403})).toBe(false);
  expect(recruiterConversationAcknowledged({...base,redirected:false})).toBe(false);
  expect(recruiterConversationAcknowledged({...base,redirectPath:"/login"})).toBe(false);
  expect(recruiterConversationAcknowledged({...base,threadId:"someone-else"})).toBe(false);
 });
});
