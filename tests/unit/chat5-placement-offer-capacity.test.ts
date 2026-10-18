import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {hasAvailablePlacementOfferSeat,isPlacementIssuanceConcurrencyError} from "@/modules/placements/offer-seat-capacity-policy";

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
 it("PLACEMENTS-CAPACITY-03 interprets nested serialization and deadlock errors without revealing SQL",()=>{
  for(const code of ["40001","40P01"]){
    expect(isPlacementIssuanceConcurrencyError({code})).toBe(true);
    expect(isPlacementIssuanceConcurrencyError(new Error("query failed",{cause:{code}}))).toBe(true);
    expect(isPlacementIssuanceConcurrencyError({cause:{cause:{code}}})).toBe(true);
  }
  for(const input of [{code:"23505"},{code:"28000"},{message:"SQL statement failed"},new Error("40001"),null,undefined]){
    expect(isPlacementIssuanceConcurrencyError(input)).toBe(false);
  }
  const cycle:{cause?:unknown}={};cycle.cause=cycle;
  expect(isPlacementIssuanceConcurrencyError(cycle)).toBe(false);
  const issuer=src("src/modules/placements/offer-service.ts");
  const issue=issuer.slice(issuer.indexOf("export async function issuePlacementOffer"),issuer.indexOf("export async function actOnPlacementOffer"));
  expect(issue).toContain('isPlacementIssuanceConcurrencyError(error)');
  expect(issue).toContain('throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE")');
  expect(issue).toContain('throw error;');
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
 it("PLACEMENTS-EXPIRY-NOTIFY-30/31 ties SKIP LOCKED expiry history to exactly one college-scoped preference-aware notice",()=>{
  const code=src("src/modules/placements/placement-offer-expiry-sweep-service.ts");
  expect(code).toContain('eq(placementOffers.status, "ISSUED")');
  expect(code).toContain("lte(placementOffers.expiresAt, now)");
  expect(code).toContain('.for("update",{of:placementOffers,skipLocked:true})');
  expect(code).toContain('eq(placementJobs.id,placementApplications.jobId)');
  expect(code).toContain('eq(colleges.id,placementJobs.collegeId)');
  expect(code).toContain('dedupeKey:"placement-offer-expired:"+row.id');
  expect(code).toContain('eventType:"PLACEMENTS_OFFER_EXPIRED"');
  expect(code).toContain('if(event&&row.collegeStatus==="ACTIVE")');
  expect(code).toContain("deliverRecordedLearnerPlacementEvent(tx,{");
  expect(code).toContain("membershipId:row.membershipId");
  expect(code).toContain('kind:"APPLICATION_STATUS_CHANGED"');
  expect(code.indexOf('.insert(placementOfferStatusHistory)')).toBeLessThan(
    code.indexOf('deliverRecordedLearnerPlacementEvent(tx,{'));
 });
 it("waitlist preview counts only official OFFER kind in available-seat arithmetic, retaining all held applications",()=>{
  const service=src("src/modules/placements/tpo-waitlist-promotion-service.ts");
  expect(service).toContain('const occupiedOfferSeats=activeOffers.filter(offer=>offer.kind==="OFFER").length');
  expect(service).toContain('job.openings-occupiedOfferSeats-reservedCount');
  expect(service).toContain('eq(placementOffers.kind,"OFFER")');
  expect(service).toContain("const held=new Set(activeOffers.map(x=>x.applicationId))");
 });
});
