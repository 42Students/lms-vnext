import {expect,it} from "vitest";
import {slotTransitionAllowed} from "@/modules/placements/hr-interview-slot-model";
it.each([[NaN,2],[-1,2],[1,0],[3,2],[0,Infinity],[1,1.5],[Number.MAX_SAFE_INTEGER+1,100]])(
 "rejects corrupt reserved/capacity counter pair %s %s",(booked,capacity)=>{
 expect(slotTransitionAllowed("OFFERED","BOOK",booked,capacity)).toBe(false);
 expect(slotTransitionAllowed("PROPOSED","OFFER",booked,capacity)).toBe(false);
});
it("keeps valid offered and booking transitions",()=>{
 expect(slotTransitionAllowed("OFFERED","BOOK",1,2)).toBe(true);
 expect(slotTransitionAllowed("OFFERED","BOOK",2,2)).toBe(false);
});
