import { describe,expect,it } from "vitest";
import { browseOwnLearnerOffers } from "@/modules/placements/learner-offers-browse-model";
const row=(id:string,date:string)=>({offer:{id,status:"ISSUED",issuedAt:new Date(date)}});
describe("own-offer base ordering",()=>{
 it("sorts malformed dates last without modifying the input",()=>{
  const input=[row("bad","invalid"),row("new","2026-10-15T12:00:00Z"),row("old","2026-10-01T12:00:00Z")];
  expect(browseOwnLearnerOffers(input,"all").items.map(x=>x.offer.id)).toEqual(["new","old","bad"]);
  expect(input[0]?.offer.id).toBe("bad");
 });
 it("uses the offer ID as a deterministic tie break",()=>{
  const input=[row("b","invalid"),row("a","invalid")];
  expect(browseOwnLearnerOffers(input,"pending").items.map(x=>x.offer.id)).toEqual(["a","b"]);
 });
});