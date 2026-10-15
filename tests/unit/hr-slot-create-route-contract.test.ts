import {expect,it} from "vitest";
import {hrInterviewSlotCreateSchema} from "@/modules/placements/hr-interview-slot-model";
it("accepts the exact CREATE action sent by a same-origin form and rejects unrelated fields",()=>{
 const row={action:"CREATE",roundId:"11111111-1111-4111-8111-111111111111",
 startAt:"2026-10-21T10:00:00+05:30",endAt:"2026-10-21T10:30:00+05:30",
 timezone:"Asia/Kolkata",mode:"VIRTUAL",capacity:1};
 expect(hrInterviewSlotCreateSchema.safeParse(row).success).toBe(true);
 expect(hrInterviewSlotCreateSchema.safeParse({...row,learnerId:row.roundId}).success).toBe(false);
 expect(hrInterviewSlotCreateSchema.safeParse({...row,action:"DELETE"}).success).toBe(false);
});
