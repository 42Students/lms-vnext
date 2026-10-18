import {describe,expect,it} from "vitest";
import {isPlacementApplicationDeadlinePassed} from "@/modules/placements/application-deadline-policy";
import {countVerifiedExternalPlacements,externalOfferAnnualCtcInr,isVerifiedExternalPlacement,nextExternalOfferStatus,type ExternalOfferReview} from "@/modules/placements/external-offer-policy";

const reviewed:ExternalOfferReview={
 status:"VERIFIED",reviewedByUserId:"11111111-1111-4111-8111-111111111111",
 reviewedAt:new Date("2099-01-01T10:00:00.000Z"),
 revokedAt:null,ctcLpa:"12.34",
};

describe("chat-5 external offers, retention of verified evidence and expiry gates",()=>{
 it.each([
  ["SUBMITTED","VERIFY","VERIFIED"],["SUBMITTED","REJECT","REJECTED"],
  ["VERIFIED","REVOKE","REVOKED"],
 ] as const)("PLACEMENTS-EXTERNAL-01 allows %s -> %s -> %s",(before,decision,after)=>{
  expect(nextExternalOfferStatus(before,decision)).toBe(after);
 });
 it.each([
  ["SUBMITTED","REVOKE"],["VERIFIED","VERIFY"],["VERIFIED","REJECT"],
  ["REJECTED","VERIFY"],["REVOKED","VERIFY"],["REVOKED","REVOKE"],
 ] as const)("PLACEMENTS-EXTERNAL-02 refuses forbidden %s / %s transitions",(before,decision)=>{
  expect(()=>nextExternalOfferStatus(before,decision)).toThrow("DB08_EXTERNAL_OFFER_INVALID_TRANSITION");
 });
 it("PLACEMENTS-EXTERNAL-03 reviewed, persisted, non-revoked verification alone contributes to placement counts",()=>{
  const rows:ExternalOfferReview[]=[
   reviewed,
   {...reviewed,status:"SUBMITTED"},
   {...reviewed,status:"REJECTED"},
   {...reviewed,status:"REVOKED"},
   {...reviewed,reviewedByUserId:null},
   {...reviewed,reviewedAt:null},
   {...reviewed,revokedAt:new Date("2099-01-02T10:00:00.000Z")},
  ];
  expect(rows.map(isVerifiedExternalPlacement)).toEqual([true,false,false,false,false,false,false]);
  expect(countVerifiedExternalPlacements(rows)).toBe(1);
 });
 it("PLACEMENTS-EXTERNAL-04 converts exact decimal salary and never guesses unknown/invalid amount",()=>{
  expect(externalOfferAnnualCtcInr(reviewed)).toBe(1_234_000n);
  expect(externalOfferAnnualCtcInr({...reviewed,ctcLpa:"0.01"})).toBe(1_000n);
  expect(externalOfferAnnualCtcInr({...reviewed,ctcLpa:"0"})).toBe(0n);
  expect(externalOfferAnnualCtcInr({...reviewed,ctcLpa:null})).toBeNull();
  expect(externalOfferAnnualCtcInr({...reviewed,ctcLpa:"0.001"})).toBeNull();
  expect(externalOfferAnnualCtcInr({...reviewed,ctcLpa:"1e5"})).toBeNull();
  expect(externalOfferAnnualCtcInr({...reviewed,status:"REVOKED"})).toBeNull();
 });
 it("PLACEMENTS-DEADLINE-01 application closes precisely at the exclusive instant",()=>{
  const deadline=new Date("2099-05-21T18:29:59.999Z");
  expect(isPlacementApplicationDeadlinePassed(deadline,new Date(deadline.getTime()-1))).toBe(false);
  expect(isPlacementApplicationDeadlinePassed(deadline,deadline)).toBe(true);
  expect(isPlacementApplicationDeadlinePassed(deadline,new Date(deadline.getTime()+1))).toBe(true);
  expect(isPlacementApplicationDeadlinePassed(null,new Date())).toBe(false);
 });
});
