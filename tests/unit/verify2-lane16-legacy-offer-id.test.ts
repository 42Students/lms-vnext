import {describe,expect,it} from "vitest";
import {legacyNumericOfferId,learnerOfferFocusMissing,learnerOfferRecoveryHref} from "@/modules/placements/learner-offer-deep-link-model";

describe("G2-17-23-015 numeric-to-UUID owned offer ID bridge",()=>{
 it("normalizes positive legacy offer IDs and rejects unsafe identifiers",()=>{
  expect(legacyNumericOfferId("1")).toBe(1);
  expect(legacyNumericOfferId("2147483647")).toBe(2147483647);
  for(const value of ["0","-20","0001","2147483648","1.3"," 1","1 ","1e3",null,2]){
   expect(legacyNumericOfferId(value)).toBeNull();
  }
 });
 it("retains only validated numeric bookmarks in the authorized missing-offer fallback",()=>{
  expect(learnerOfferFocusMissing("143",false)).toBe(true);
  expect(learnerOfferRecoveryHref("143")).toBe("/learn/my-placements/offers?focus=143");
  expect(learnerOfferFocusMissing("143",true)).toBe(false);
  expect(learnerOfferFocusMissing("-143",false)).toBe(false);
  expect(learnerOfferRecoveryHref("-143")).toBe("/learn/my-placements/offers");
 });
});
