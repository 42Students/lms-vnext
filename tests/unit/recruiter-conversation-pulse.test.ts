import {describe,expect,it} from "vitest";
import {recruiterConversationPulseSignature} from "@/modules/placements/recruiter-conversation-pulse-model";
describe("REC-calendar-messages-profile-13 scoped conversation pulse",()=>{
 const base={id:"a",createdAt:new Date("2026-10-17T00:00:00Z"),lastMessageAt:null};
 it("is stable regardless of row order",()=>{
  const other={id:"b",createdAt:new Date("2026-10-17T00:00:01Z"),lastMessageAt:null};
  expect(recruiterConversationPulseSignature([base,other])).toBe(recruiterConversationPulseSignature([other,base]));
 });
 it("changes when a thread appears or a new message is delivered",()=>{
  const a=recruiterConversationPulseSignature([base]);
  expect(recruiterConversationPulseSignature([base,{...base,id:"b"}])).not.toBe(a);
  expect(recruiterConversationPulseSignature([{...base,lastMessageAt:new Date("2026-10-17T00:00:15Z")}])).not.toBe(a);
 });
 it("does not mutate the source rows",()=>{
  const rows=[{...base,id:"z"},{...base,id:"a"}];
  recruiterConversationPulseSignature(rows);
  expect(rows.map(x=>x.id)).toEqual(["z","a"]);
 });
});
