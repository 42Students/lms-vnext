import {describe,it,expect} from "vitest";
import {learnerExpiredIssuedOffers} from "@/modules/placements/learner-offer-issued-expired-model";
describe("learner issued-offer expiry disclosure",()=>{
 it("counts only issued offers with past or invalid persisted deadlines",()=>{
  const rows=[
   {offer:{status:"ISSUED",expiresAt:new Date("2026-10-14T00:00:00Z")}},
   {offer:{status:"ISSUED",expiresAt:new Date("invalid")}},
   {offer:{status:"ISSUED",expiresAt:null}},
   {offer:{status:"ACCEPTED",expiresAt:new Date("2026-10-14T00:00:00Z")}},
  ];
  expect(learnerExpiredIssuedOffers(rows,Date.parse("2026-10-15"))).toBe(2);
 });
 it("does not interpret invalid client clock as permission or expiry",()=>{
  expect(learnerExpiredIssuedOffers([{offer:{status:"ISSUED",expiresAt:new Date()}}],NaN)).toBe(0);
 });
});
