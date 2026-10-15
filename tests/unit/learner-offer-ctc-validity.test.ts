import {expect,it} from "vitest";
import {learnerOfferCtc} from "@/modules/placements/learner-offer-ctc-model";
it("does not misrepresent invalid saved amounts as compensation",()=>{
 expect(learnerOfferCtc(1200000)).toBe(1200000);
 for(const value of [NaN,Infinity,-100,1.5])expect(learnerOfferCtc(value)).toBeNull();
 expect(learnerOfferCtc(null)).toBeNull();
});
