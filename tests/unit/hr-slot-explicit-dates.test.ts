import {it,expect} from "vitest";
import {hrInterviewSlotCreateSchema} from "@/modules/placements/hr-interview-slot-model";
const slot={roundId:"11111111-1111-4111-8111-111111111111",
 startAt:"2026-10-21T10:00:00+05:30",endAt:"2026-10-21T11:00:00+05:30",
 timezone:"Asia/Kolkata",mode:"VIRTUAL",capacity:2};
it("accepts explicit IST timestamps from the form",()=>{
 const result=hrInterviewSlotCreateSchema.parse(slot);
 expect(result.startAt).toBeInstanceOf(Date);
});
it.each([true,0,1,null,{},[], "2026-10-21", "10:00"])(
 "rejects silently coerced slot start %s",startAt=>{
 expect(hrInterviewSlotCreateSchema.safeParse({...slot,startAt}).success).toBe(false);
});
