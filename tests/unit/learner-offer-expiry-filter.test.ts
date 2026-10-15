import {expect,it} from "vitest";
import {filterOwnOffersByExpiry,learnerOfferExpirySchema} from "@/modules/placements/learner-offer-expiry-filter-model";
import {learnerOfferStatusHref} from "@/modules/placements/learner-offers-navigation-model";
it("separates issued expired, issued undated and closed offers at the request clock",()=>{
 const now=Date.parse("2026-10-15T00:00:00Z");
 const row=(id:string,status:string,expiresAt:Date|null)=>({id,offer:{status,expiresAt}});
 const rows=[row("past","ISSUED",new Date(now)),row("future","ISSUED",new Date(now+1)),row("none","ISSUED",null),row("accepted","ACCEPTED",new Date(now-1))];
 expect(filterOwnOffersByExpiry(rows,"expired",now).map(x=>x.id)).toEqual(["past"]);
 expect(filterOwnOffersByExpiry(rows,"undated",now).map(x=>x.id)).toEqual(["none"]);
 expect(filterOwnOffersByExpiry(rows,"all",now)).toHaveLength(4);
 expect(learnerOfferExpirySchema.safeParse("foreign").success).toBe(false);
 expect(learnerOfferStatusHref("pending",{searchTerm:"",dueOnly:false,sort:"priority",expiry:"undated"})).toContain("expiry=undated");
});
