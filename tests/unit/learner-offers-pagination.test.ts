import {it,expect} from "vitest";
import {learnerOfferPageSchema,paginateOwnOffers} from "@/modules/placements/learner-offers-pagination-model";
it("clamps stale pages and never fabricates records",()=>{
 const rows=Array.from({length:31},(_,i)=>i);
 expect(paginateOwnOffers(rows,100).items).toEqual([30]);
 expect(paginateOwnOffers(rows,100).page).toBe(3);
 expect(paginateOwnOffers([],1).from).toBe(0);
 expect(learnerOfferPageSchema.safeParse("not-number").success).toBe(false);
 expect(learnerOfferPageSchema.safeParse("0").success).toBe(false);
});
