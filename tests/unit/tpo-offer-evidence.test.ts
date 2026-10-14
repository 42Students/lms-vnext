import {describe,it,expect} from "vitest";
import {projectOfferEvidence,tpoOfferEvidenceQuery} from "@/modules/placements/tpo-offer-evidence-model";
describe("offer evidence projection",()=>{
 it("orders actual events without inferring missing ones",()=>{
  const a={id:"1",fromStatus:"ISSUED",toStatus:"ACCEPTED",reason:"Verified",createdAt:new Date("2026-10-03T00:00:00Z")};
  const b={id:"2",fromStatus:null,toStatus:"ISSUED",reason:null,createdAt:new Date("2026-10-01T00:00:00Z")};
  const result=projectOfferEvidence([a,b],[{id:"3",fromStatus:"PENDING",toStatus:"JOINED",reason:null,createdAt:new Date("2026-10-04T00:00:00Z")}]);
  expect(result.events.map(r=>r.to)).toEqual(["ISSUED","ACCEPTED","JOINED"]);
  expect(result.events[1]?.reason).toBe("Verified");
  expect(projectOfferEvidence([],[]).events).toEqual([]);
 });
 it("rejects foreign fields at URL boundary",()=>{
  const jobId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",offerId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  expect(tpoOfferEvidenceQuery.safeParse({jobId,offerId}).success).toBe(true);
  expect(tpoOfferEvidenceQuery.safeParse({jobId,offerId,private:"x"}).success).toBe(false);
 });
});
