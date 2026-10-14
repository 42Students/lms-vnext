import {describe,expect,it} from "vitest";
import {learnerOfferExtensionRequest,learnerOfferExtensionLocalDefault}
from "@/modules/placements/learner-offer-extension-model";
const offerId="81818181-8181-4818-8818-818181818181";
const applicationId="82828282-8282-4828-8828-828282828282";
const input={offerId,applicationId,status:"ISSUED",confirmed:true,
  expectedExpiresAt:"2030-11-01T00:00:00.000Z",requestedLocalAt:"2030-11-04T09:00",
  reason:"Examination scheduling conflict"};
describe("learner offer deadline extension IST and stale state",()=>{
  it("submits an IST date as UTC with a persisted expiry comparison token",()=>{
    expect(learnerOfferExtensionRequest(input,"2026-10-14T00:00:00Z"))
      .toMatchObject({requestType:"OFFER_EXTENSION",expectedExpiresAt:input.expectedExpiresAt,
        requestedExpiresAt:"2030-11-04T03:30:00.000Z"});
    expect(learnerOfferExtensionLocalDefault(input.expectedExpiresAt)).toBe("2030-11-03T05:30");
  });
  it("denies expired, invalid, unconfirmed and caller-supplied college actions",()=>{
    for(const raw of [
      {...input,requestedLocalAt:"2030-10-31T09:00"},
      {...input,requestedLocalAt:"2030-11-31T09:00"},
      {...input,confirmed:false},
      {...input,collegeId:"foreign"},
    ])expect(()=>learnerOfferExtensionRequest(raw,"2026-10-14T00:00:00Z")).toThrow();
  });
});