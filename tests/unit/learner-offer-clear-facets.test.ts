import {expect,it} from "vitest";
import {learnerOfferClearFiltersHref,learnerOfferHasActiveFacets} from "@/modules/placements/learner-offers-navigation-model";
it("clears optional facets but preserves the learner own-offer status tab",()=>{
 const selection={searchTerm:"Acme",dueOnly:true,sort:"company" as const,kind:"loi",joining:"deferred"};
 expect(learnerOfferHasActiveFacets(selection)).toBe(true);
 const url=new URL(learnerOfferClearFiltersHref("pending"),"https://example.test");
 expect(url.pathname).toBe("/learn/my-placements/offers");
 expect(url.searchParams.get("status")).toBe("pending");
 for(const key of ["q","due","sort","kind","joining","page"])expect(url.searchParams.has(key)).toBe(false);
 expect(learnerOfferHasActiveFacets({searchTerm:"",dueOnly:false,sort:"priority",kind:"all",joining:"all"})).toBe(false);
});
