import {it,expect} from "vitest";
import {sortOwnOfferRows as sort} from "@/modules/placements/learner-offers-sort-model";
it("keeps pending urgency and allows case-insensitive company order without changing source",()=>{
 const now=Date.parse("2026-10-15T00:00:00Z");
 const r=(id:string,name:string,day:number)=>({offer:{id,status:"ISSUED",issuedAt:new Date(now),expiresAt:new Date(now+day*86400000)},company:{name}});
 const rows=[r("1","Beta 10",2),r("2","beta 2",1)];
 expect(sort(rows,"priority",now)[0].offer.id).toBe("2");
 expect(sort(rows,"company",now)[0].offer.id).toBe("2");
 expect(rows[0].offer.id).toBe("1");
});
