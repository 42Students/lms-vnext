import {expect,it} from "vitest";
import {hrInterviewSlotActionSchema} from "@/modules/placements/hr-interview-slot-model";
it("does not accept candidate or company identifiers when reserving slot capacity",()=>{
 const slotId="11111111-1111-4111-8111-111111111111";
 expect(hrInterviewSlotActionSchema.safeParse({slotId,expectedVersion:1,action:"BOOK"}).success).toBe(true);
 expect(hrInterviewSlotActionSchema.safeParse({slotId,expectedVersion:1,action:"BOOK",learnerId:slotId}).success).toBe(false);
});
