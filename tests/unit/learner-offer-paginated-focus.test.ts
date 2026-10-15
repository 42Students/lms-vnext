import {it,expect} from "vitest";
import {learnerOfferHref,resolveLearnerOfferFocus} from "@/modules/placements/learner-offer-deep-link-model";
it("focuses an owned record on any results page and ignores forged identifiers",()=>{
 const rows=Array.from({length:32},(_,i)=>({offer:{id:"00000000-0000-4000-8000-"+String(i+1).padStart(12,"0")}}));
 const target=rows[21].offer.id;
 expect(resolveLearnerOfferFocus(rows,1,target)).toEqual({page:2,found:true});
 expect(resolveLearnerOfferFocus(rows,1,rows[31].offer.id)).toEqual({page:3,found:true});
 expect(resolveLearnerOfferFocus(rows,1,"00000000-0000-4000-8000-999999999999")).toEqual({page:1,found:false});
 expect(resolveLearnerOfferFocus(rows,1,["fake",target])).toEqual({page:1,found:false});
 expect(learnerOfferHref(target)).toContain("?focus="+target+"#offer-"+target);
});
