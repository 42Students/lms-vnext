import {expect,it} from "vitest";
import {paginateOwnOffers} from "@/modules/placements/learner-offers-pagination-model";
import {resolveLearnerOfferFocus} from "@/modules/placements/learner-offer-deep-link-model";
it("clamps stale pages but honors owned offer focus as a deliberate page change",()=>{
 const ids=Array.from({length:23},(_,i)=>({offer:{id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0")}}));
 const page=paginateOwnOffers(ids,99,15);expect(page.page).toBe(2);
 const focused=resolveLearnerOfferFocus(ids,99,ids[1].offer.id);
 expect(focused).toEqual({page:1,found:true});
 expect(paginateOwnOffers(ids,focused.page,15).page).toBe(1);
});
