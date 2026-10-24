import {describe,expect,it} from "vitest";
import {confirmedTpoFollowupDoneSchema,tpoFollowupDoneAudit} from "@/modules/placements/tpo-followup-queue-model";
const base={confirmed:true as const,expectedDueAt:"2026-10-25T13:00:00+05:30",
 outcome:"CALL_BACK" as const,note:"Asked to speak after their manager returns."};
describe("TPO Today atomic follow-up continuation contract",()=>{
 it("accepts a call-back outcome and explicit offset time for the next follow-up",()=>{
  const payload={...base,nextDueAt:"2026-10-27T10:00:00+05:30"};
  expect(confirmedTpoFollowupDoneSchema.parse(payload)).toEqual(payload);
  expect(tpoFollowupDoneAudit(payload.outcome,payload.note)).toContain("CALL_BACK");
 });
 it("preserves plain Done without a next follow-up",()=>{
  expect(confirmedTpoFollowupDoneSchema.safeParse({...base,outcome:"CONTACTED"}).success).toBe(true);
 });
 it("rejects unconfirmed, date-only, unexpected or missing decision evidence",()=>{
  expect(confirmedTpoFollowupDoneSchema.safeParse({...base,confirmed:false}).success).toBe(false);
  expect(confirmedTpoFollowupDoneSchema.safeParse({...base,nextDueAt:"2026-10-27T10:00:00"}).success).toBe(false);
  expect(confirmedTpoFollowupDoneSchema.safeParse({...base,otherCollegeId:"foreign"}).success).toBe(false);
  expect(confirmedTpoFollowupDoneSchema.safeParse({...base,note:""}).success).toBe(false);
 });
});
