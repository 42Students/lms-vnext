import {it,expect} from "vitest";
import {learnerOfferPageSchema as s} from "@/modules/placements/learner-offers-pagination-model";
it("accepts canonical bounded pages and denies coercible malformed parameters",()=>{
 expect(s.parse("1")).toBe(1);expect(s.parse("9999")).toBe(9999);
 for(const x of ["0","01"," 1 ","1.0","1e2","10000",["1"],null,1])expect(s.safeParse(x).success).toBe(false);
});
