import {expect,it} from "vitest";
import {hrInterviewSlotCreateSchema} from "@/modules/placements/hr-interview-slot-model";
const row={roundId:"11111111-1111-4111-8111-111111111111",
 startAt:"2026-10-20T10:00:00+05:30",endAt:"2026-10-20T11:00:00+05:30",
 timezone:"Asia/Kolkata",mode:"VIRTUAL",capacity:2};
it.each(["Panel\nApproved","Panel\rYes","Panel\tInjected","Panel\u0000Name"])(
 "rejects multi-line or control-bearing recruiter panel labels %s",panelLabel=>{
 expect(hrInterviewSlotCreateSchema.safeParse({...row,panelLabel}).success).toBe(false);
});
it("preserves ordinary interview panel labels",()=>{
 expect(hrInterviewSlotCreateSchema.safeParse({...row,panelLabel:"Technical Panel A"}).success).toBe(true);
});
