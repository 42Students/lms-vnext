import {expect,it} from "vitest";
import {hrInterviewSlotCreateSchema} from "@/modules/placements/hr-interview-slot-model";
const row={roundId:"11111111-1111-4111-8111-111111111111",
 startAt:"2026-10-20T10:00:00+05:30",endAt:"2026-10-20T11:00:00+05:30",
 timezone:"Asia/Kolkata",mode:"VIRTUAL",capacity:2};
it("accepts strictly positive capacity form strings and numbers",()=>{
 expect(hrInterviewSlotCreateSchema.safeParse({...row,capacity:"2"}).success).toBe(true);
 expect(hrInterviewSlotCreateSchema.safeParse(row).success).toBe(true);
});
it.each([true,false,"1e2","01"," 2 ","2.0",2.5,-1,0,101,Number.POSITIVE_INFINITY])(
 "rejects ambiguous or out-of-range slot capacity %s",capacity=>{
 expect(hrInterviewSlotCreateSchema.safeParse({...row,capacity}).success).toBe(false);
});
