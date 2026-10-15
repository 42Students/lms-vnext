import {expect,it} from "vitest";
import {slotTransitionAllowed} from "@/modules/placements/hr-interview-slot-model";
it("does not book a merely proposed time block or a cancelled offer",()=>{
 expect(slotTransitionAllowed("PROPOSED","BOOK")).toBe(false);
 expect(slotTransitionAllowed("CANCELLED","BOOK")).toBe(false);
 expect(slotTransitionAllowed("OFFERED","BOOK")).toBe(true);
});
