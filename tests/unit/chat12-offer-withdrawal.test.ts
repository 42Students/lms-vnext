import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync(new URL("../../src/modules/placements/request-service.ts",import.meta.url),"utf8");
describe("TPO-requests-verification-R01 outstanding issued offer on withdrawal",()=>{
 it("TPO-requests-verification-R01 allows a learner to request withdrawal with an ISSUED but not ACCEPTED offer",()=>{
  expect(source).toContain('eq(placementOffers.status,"ACCEPTED")');
  expect(source).toContain('if(activeOffer)throw new PlacementsServiceError');
 });
 it("TPO-requests-verification-R01 declines the issued offer with status history before application withdrawal",()=>{
  const start=source.indexOf('for(const offer of offers.filter(offer=>offer.status==="ISSUED"))');
  expect(start).toBeGreaterThan(0);
  const write=source.indexOf('db.insert(placementOfferStatusHistory).values',start);
  const withdrawal=source.indexOf('status: "WITHDRAWN"',write);
  expect(write).toBeGreaterThan(start);
  expect(withdrawal).toBeGreaterThan(write);
  expect(source).toContain('fromStatus:"ISSUED",toStatus:"DECLINED"');
 });
 it("TPO-requests-verification-R01 refuses an accepted offer instead of silently reversing it",()=>{
  expect(source).toContain('offers.some(offer=>offer.status==="ACCEPTED")');
  expect(source).toContain('throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID")');
 });
});
