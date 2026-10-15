import {expect,it} from "vitest";
import {learnerOfferResponseTiming} from "@/modules/placements/learner-offer-response-timing-model";
it("never exposes an accept action for invalid saved expiry or issue dates",()=>{
 const snapshot="2026-10-15T00:00:00Z";
 expect(learnerOfferResponseTiming({status:"ISSUED",issuedAt:"bad",expiresAt:null},snapshot))
  .toMatchObject({canRespond:false,urgency:"INVALID"});
 expect(learnerOfferResponseTiming({status:"ISSUED",issuedAt:snapshot,expiresAt:"invalid"},snapshot))
  .toMatchObject({canRespond:false,urgency:"INVALID"});
 expect(learnerOfferResponseTiming({status:"ISSUED",issuedAt:snapshot,expiresAt:null},snapshot).canRespond).toBe(true);
});
