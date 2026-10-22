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

it("resolves imported numeric bookmarks only when the offer is already owned and in the scoped result",()=>{
 const rows=[
  {offer:{id:"00000000-0000-4000-8000-000000000001",legacyOfferId:143}},
  {offer:{id:"00000000-0000-4000-8000-000000000002",legacyOfferId:215}},
 ];
 expect(resolveLearnerOfferFocus(rows,1,"215",1)).toEqual({page:2,found:true});
 expect(resolveLearnerOfferFocus(rows,1,"143")).toEqual({page:1,found:true});
 for(const bad of ["0","-1","0215","2147483648","9999999999999999999","215 OR 1=1"]){
  expect(resolveLearnerOfferFocus(rows,3,bad)).toEqual({page:3,found:false});
 }
 expect(resolveLearnerOfferFocus(rows,2,"999")).toEqual({page:2,found:false});
});
