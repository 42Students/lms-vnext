import {expect,it} from "vitest";
import {resolveLearnerOfferFocus} from "@/modules/placements/learner-offer-deep-link-model";
it("finds owned offer id irrespective of UUID casing, without trusting malformed page size",()=>{
 const id="00000000-0000-4000-8000-abcdef123456";
 const rows=[{offer:{id:id.toUpperCase()}}];
 expect(resolveLearnerOfferFocus(rows,3,id,15)).toEqual({found:true,page:1});
 expect(()=>resolveLearnerOfferFocus(rows,1,id,0)).toThrow("INVALID_OFFER_PAGE_SIZE");
 expect(resolveLearnerOfferFocus(rows,2,"../../admin")).toEqual({found:false,page:2});
});
