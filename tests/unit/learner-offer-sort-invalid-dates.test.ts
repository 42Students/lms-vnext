import {describe,it,expect} from "vitest";
import {sortOwnOfferRows} from "@/modules/placements/learner-offers-sort-model";
const row=(id:string,issuedAt:string,expiresAt:string|null,status="ISSUED")=>({
 offer:{id,status,issuedAt:new Date(issuedAt),expiresAt:expiresAt?new Date(expiresAt):null},
 company:{name:"Employer"}
});
describe("learner offer sort safety",()=>{
 it("places malformed issued dates last in newest sort with stable ties",()=>{
  const items=[row("bad","oops",null),row("recent","2026-10-16T00:00:00Z",null),row("old","2026-10-10T00:00:00Z",null)];
  expect(sortOwnOfferRows(items,"newest",Date.parse("2026-10-15")) .map(x=>x.offer.id)).toEqual(["recent","old","bad"]);
 });
 it("does not mark malformed expiry as an actionable issued offer",()=>{
  const items=[row("invalid","2026-10-16T00:00:00Z","invalid"),row("good","2026-10-16T00:00:00Z",null)];
  expect(sortOwnOfferRows(items,"priority",Date.parse("2026-10-15"))[0]?.offer.id).toBe("good");
 });
});
