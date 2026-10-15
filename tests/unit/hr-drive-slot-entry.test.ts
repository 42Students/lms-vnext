import {expect,it} from "vitest";
import {hrInterviewSlotActionSchema,slotTransitionAllowed} from "@/modules/placements/hr-interview-slot-model";
it("offers must be reviewed before an internal time block can be reserved",()=>{
 expect(slotTransitionAllowed("PROPOSED","BOOK")).toBe(false);
 expect(slotTransitionAllowed("OFFERED","BOOK")).toBe(true);
 expect(hrInterviewSlotActionSchema.safeParse({
  slotId:"11111111-1111-4111-8111-111111111111",expectedVersion:0,action:"BOOK",
 }).success).toBe(false);
});
