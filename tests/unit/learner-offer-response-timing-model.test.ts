import {describe,expect,it} from "vitest";
import {learnerOfferResponseTiming,prioritizeLearnerOffers}
  from "@/modules/placements/learner-offer-response-timing-model";
const now="2026-10-14T12:00:00Z";
const offer=(id:string,status:"ISSUED"|"ACCEPTED",expiresAt:string|null)=>({
  id,status,expiresAt,issuedAt:"2026-10-01T00:00:00Z",
});
describe("learner offer response expiry at server snapshot",()=>{
  it("blocks expired response, warns imminent, and never marks accepted offer as actionable",()=>{
    expect(learnerOfferResponseTiming(offer("a","ISSUED","2026-10-14T11:59:59Z"),now))
      .toMatchObject({expired:true,canRespond:false,urgency:"EXPIRED"});
    expect(learnerOfferResponseTiming(offer("b","ISSUED","2026-10-15T00:00:00Z"),now))
      .toMatchObject({expired:false,canRespond:true,urgency:"SOON"});
    expect(learnerOfferResponseTiming(offer("c","ACCEPTED",null),now))
      .toMatchObject({canRespond:false,urgency:"RESOLVED"});
  });
  it("prioritizes response-required offers by nearest valid expiry without changing input",()=>{
    const rows=[offer("closed","ACCEPTED",null),
      offer("far","ISSUED","2026-12-01T00:00:00Z"),
      offer("expired","ISSUED","2026-10-01T00:00:00Z"),
      offer("soon","ISSUED","2026-10-15T00:00:00Z")];
    expect(prioritizeLearnerOffers(rows,now).map(x=>x.id))
      .toEqual(["soon","far","expired","closed"]);
    expect(rows[0]?.id).toBe("closed");
  });
});
