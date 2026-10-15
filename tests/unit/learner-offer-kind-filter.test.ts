import {it,expect} from "vitest";
import {filterOwnOffersByKind as f,learnerOfferKindSchema as s} from "@/modules/placements/learner-offer-kind-model";
it("does not confuse a letter of intent with a formal offer",()=>{
 const rows=[{offer:{kind:"LOI"}},{offer:{kind:"OFFER"}}];
 expect(f(rows,"loi")).toEqual([rows[0]]);
 expect(f(rows,"offer")).toEqual([rows[1]]);
 expect(f(rows,"all")).toHaveLength(2);
 expect(s.safeParse(["offer"]).success).toBe(false);
});
