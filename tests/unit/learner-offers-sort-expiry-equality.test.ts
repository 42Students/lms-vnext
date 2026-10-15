import {it,expect} from "vitest";
import {sortOwnOfferRows} from "@/modules/placements/learner-offers-sort-model";
it("sorts actionable next-second offer ahead of exact-expiry offer",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 const r=(id:string,expiresAt:Date)=>({offer:{id,status:"ISSUED",issuedAt:new Date("2026-10-14T00:00:00Z"),expiresAt},company:{name:"Acme"}});
 const rows=[r("expired",now),r("active",new Date(now.getTime()+1))];
 expect(sortOwnOfferRows(rows,"priority",now.getTime()).map(x=>x.offer.id)).toEqual(["active","expired"]);
});
