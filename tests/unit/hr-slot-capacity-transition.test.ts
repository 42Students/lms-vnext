import {expect,it} from "vitest";
import {slotTransitionAllowed} from "@/modules/placements/hr-interview-slot-model";
it("limits repeated internal slot reservations to declared capacity",()=>{
 expect(slotTransitionAllowed("OFFERED","BOOK",0,2)).toBe(true);
 expect(slotTransitionAllowed("BOOKED","BOOK",1,2)).toBe(true);
 expect(slotTransitionAllowed("BOOKED","BOOK",2,2)).toBe(false);
 expect(slotTransitionAllowed("CANCELLED","BOOK",0,2)).toBe(false);
});
