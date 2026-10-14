import {describe,expect,it} from "vitest";
import {learnerPendingOfferExtensions} from "@/modules/placements/learner-offer-pending-request-model";
describe("own pending offer extensions",()=>{
  it("uses persisted offer IDs and pending request type only",()=>{
    const pending=learnerPendingOfferExtensions([
      {offerId:"own",requestType:"OFFER_EXTENSION",status:"PENDING"},
      {offerId:"old",requestType:"OFFER_EXTENSION",status:"CANCELLED"},
      {offerId:"other",requestType:"APPLICATION_WITHDRAWAL",status:"PENDING"},
      {offerId:null,requestType:"OFFER_EXTENSION",status:"PENDING"},
    ]);
    expect([...pending]).toEqual(["own"]);
  });
});