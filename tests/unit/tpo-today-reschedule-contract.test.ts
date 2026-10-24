import {describe,expect,it} from "vitest";
import {confirmedTpoFollowupRescheduleSchema} from "@/modules/placements/tpo-followup-queue-model";
describe("Companies Today follow-up rescheduling boundary",()=>{
 const sample={confirmed:true as const,expectedDueAt:"2026-10-24T05:00:00+05:30",dueAt:"2026-10-25T10:00:00+05:30"};
 it("requires explicit confirmation and changed absolute time",()=>{
  expect(confirmedTpoFollowupRescheduleSchema.parse(sample)).toEqual(sample);
  expect(confirmedTpoFollowupRescheduleSchema.safeParse({...sample,dueAt:sample.expectedDueAt}).success).toBe(false);
  expect(confirmedTpoFollowupRescheduleSchema.safeParse({...sample,confirmed:false}).success).toBe(false);
 });
 it("rejects extra properties, missing optimistic token, or ambiguous local dates",()=>{
  expect(confirmedTpoFollowupRescheduleSchema.safeParse({...sample,jobId:"foreign"}).success).toBe(false);
  expect(confirmedTpoFollowupRescheduleSchema.safeParse({confirmed:true,dueAt:sample.dueAt}).success).toBe(false);
  expect(confirmedTpoFollowupRescheduleSchema.safeParse({...sample,dueAt:"2026-10-25T10:00:00"}).success).toBe(false);
 });
});
