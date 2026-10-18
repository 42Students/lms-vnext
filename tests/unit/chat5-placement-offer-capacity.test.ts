import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {hasAvailablePlacementOfferSeat} from "@/modules/placements/offer-seat-capacity-policy";

const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("PLACEMENTS-CAPACITY-01: active official offers and pending waitlist reservations share one seat ceiling",()=>{
 it("permits unlimited openings but rejects corrupt counters and invalid finite openings",()=>{
  expect(hasAvailablePlacementOfferSeat({openings:null,activeOfferCount:120,otherPendingReservations:10})).toBe(true);
  for(const bad of [NaN,Infinity,-1,0.5,Number.MAX_SAFE_INTEGER+1])
    expect(hasAvailablePlacementOfferSeat({openings:null,activeOfferCount:bad,otherPendingReservations:0})).toBe(false);
  for(const bad of [NaN,Infinity,-1,1.5,Number.MAX_SAFE_INTEGER+1])
    expect(hasAvailablePlacementOfferSeat({openings:bad,activeOfferCount:0,otherPendingReservations:0})).toBe(false);
  expect(hasAvailablePlacementOfferSeat({openings:0,activeOfferCount:0,otherPendingReservations:0})).toBe(false);
 });
 it("never overbooks last seat when another applicant is issued an official offer",()=>{
  expect(hasAvailablePlacementOfferSeat({openings:1,activeOfferCount:0,otherPendingReservations:0})).toBe(true);
  expect(hasAvailablePlacementOfferSeat({openings:1,activeOfferCount:1,otherPendingReservations:0})).toBe(false);
  expect(hasAvailablePlacementOfferSeat({openings:2,activeOfferCount:1,otherPendingReservations:0})).toBe(true);
  expect(hasAvailablePlacementOfferSeat({openings:2,activeOfferCount:2,otherPendingReservations:0})).toBe(false);
 });
 it("pending promotions reserve exactly one seat, but the recipient's own pending reservation is not double-counted",()=>{
  expect(hasAvailablePlacementOfferSeat({openings:2,activeOfferCount:1,otherPendingReservations:1})).toBe(false);
  expect(hasAvailablePlacementOfferSeat({openings:2,activeOfferCount:1,otherPendingReservations:0})).toBe(true);
  expect(hasAvailablePlacementOfferSeat({openings:3,activeOfferCount:1,otherPendingReservations:1})).toBe(true);
  expect(hasAvailablePlacementOfferSeat({openings:3,activeOfferCount:2,otherPendingReservations:1})).toBe(false);
 });
 it("locks the scoped job before reading capacity and inserting any new official offer",()=>{
  const code=src("src/modules/placements/offer-service.ts");
  const issue=code.slice(code.indexOf("export async function issuePlacementOffer"),code.indexOf("export async function actOnPlacementOffer"));
  expect(issue).toContain("openings: placementJobs.openings");
  expect(issue).toContain('.for("update").limit(1)');
  expect(issue).toContain('eq(placementOffers.kind,"OFFER")');
  expect(issue).toContain('eq(placementWaitlistPromotions.status,"PENDING")');
  expect(issue).toContain("ne(placementWaitlistPromotions.applicationId,current.application.id)");
  expect(issue).toContain('hasAvailablePlacementOfferSeat({');
  expect(issue).toContain('if((input.kind??"OFFER")==="OFFER")');
  expect(issue.indexOf('hasAvailablePlacementOfferSeat({')).toBeLessThan(issue.indexOf('.insert(placementOffers)'));
  expect(issue).toContain('return db.transaction(async (tx) =>');
  expect(issue).toContain('isolationLevel: "serializable"');
 });
 it("waitlist preview counts only official OFFER kind in available-seat arithmetic, retaining all held applications",()=>{
  const service=src("src/modules/placements/tpo-waitlist-promotion-service.ts");
  expect(service).toContain('const occupiedOfferSeats=activeOffers.filter(offer=>offer.kind==="OFFER").length');
  expect(service).toContain('job.openings-occupiedOfferSeats-reservedCount');
  expect(service).toContain('eq(placementOffers.kind,"OFFER")');
  expect(service).toContain("const held=new Set(activeOffers.map(x=>x.applicationId))");
 });
});
