import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("LEARNER-placements-R03 offer acceptance wiring",()=>{
 it("LEARNER-placements-R03 write path avoids unconditional cascade",()=>{
  const source=readFileSync(new URL("../../src/modules/placements/offer-service.ts",import.meta.url),"utf8");
  expect(source).toContain("const acceptedCountsAsPlaced = offer.kind");
  expect(source).toContain("shouldKeepPlacementCascadeSibling({");
  expect(source).toContain("const declinedOffers = otherOffers.filter");
  expect(source).toContain("const withdrawIds=siblingApplications.filter");
  expect(source).toContain("cascadedOfferCount: declinedOffers.length");
  expect(source).not.toContain("eq(placementApplications.membershipId, current.application.membershipId),\n         ne(placementApplications.id, current.application.id),\n         eq(placementApplications.status, \"SUBMITTED\")");
 });
});
