import {it,expect} from "vitest";
import {learnerOfferStatusHref as href} from "@/modules/placements/learner-offers-navigation-model";
import {searchOwnOffers} from "@/modules/placements/learner-offers-search-model";
import {learnerOffersExpiringSoon} from "@/modules/placements/learner-offers-expiring-soon-model";
it("keeps meaningful offer filters and calculates urgency only on matching scoped rows",()=>{
 const url=href("pending",{searchTerm:"Acme",dueOnly:true,sort:"company"});
 expect(new URL(url,"https://example.com").searchParams.get("sort")).toBe("company");
 const now=Date.parse("2026-10-15T00:00:00Z");
 const rows=[{offer:{roleTitle:"SDE",status:"ISSUED",expiresAt:new Date(now+3600000)},job:{title:"SDE"},company:{name:"Acme"}},{offer:{roleTitle:"SDE",status:"ISSUED",expiresAt:new Date(now+3600000)},job:{title:"SDE"},company:{name:"Other"}}];
 const filtered=searchOwnOffers(rows,"Acme");
 expect(learnerOffersExpiringSoon(filtered.map(x=>({status:x.offer.status,expiresAt:x.offer.expiresAt.toISOString()})),now)).toBe(1);
});
