import {it,expect} from "vitest";
import {learnerOfferResponseTiming} from "@/modules/placements/learner-offer-response-timing-model";
it("expiry at the exact snapshot instant disallows response",()=>{
 const issuedAt="2026-10-14T00:00:00.000Z",now="2026-10-15T00:00:00.000Z";
 const atDeadline=learnerOfferResponseTiming({status:"ISSUED",issuedAt,expiresAt:now},now);
 expect(atDeadline.expired).toBe(true);expect(atDeadline.canRespond).toBe(false);
 const before=learnerOfferResponseTiming({status:"ISSUED",issuedAt,expiresAt:"2026-10-15T00:00:00.001Z"},now);
 expect(before.canRespond).toBe(true);
});
