import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recordSelectionsSchema,releaseSelectionsSchema,summarizeSelectionRelease,isExactTpoSelectionReplay} from "@/modules/placements/tpo-drive-selection-model";
import {tpoWaitlistPromotionSchema,waitlistPreviewToken,decideWaitlistReleaseSettlement,canonicalWaitlistPreviewCollections} from "@/modules/placements/tpo-waitlist-promotion-model";
import {canRecordTpoActualJoiningDate,canRecordTpoOfferAction,tpoOfferLifecycleInputSchema,TPO_OFFER_ACTIONS} from "@/modules/placements/tpo-offer-lifecycle-model";
import {evaluateTpoDriveCancellation,isIssuedOfferCancelable,tpoDriveCancelSchema} from "@/modules/placements/tpo-drive-cancel-model";
import {projectTpoJoiningTracker} from "@/modules/placements/tpo-joining-tracker-model";

const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const timestamp="2099-10-18T10:00:00.000+05:30";
const record={action:"RECORD",entries:[{applicationId:a,roleTitle:"Graduate engineer",annualCtcInr:1_000_000}]};
const release={action:"VERIFY_AND_RELEASE",confirmed:true,selectionIds:[a],expectedRecordedAt:{[a]:timestamp}};
const offer={action:"RECORD_ACCEPTED",confirmed:true,offerIds:[a],expectedStatus:"ISSUED",reason:"Evidence reviewed with the placement officer"};
const cancel={action:"CANCEL",confirmed:true,expectedUpdatedAt:timestamp,expectedImpact:{submittedApplications:2,openRounds:1,issuedOffers:1,acceptedOffers:0},reason:"Company has withdrawn the recruitment process"};

describe("chat-5 placements core — selection state and release preconditions",()=>{
 it("PLACEMENTS-SEL-SM-01 refuses duplicated applicants, invalid salary and forged fields",()=>{
  expect(recordSelectionsSchema.safeParse(record).success).toBe(true);
  for(const bad of [
   {...record,entries:[record.entries[0],record.entries[0]]},
   {...record,entries:[{...record.entries[0],annualCtcInr:-1}]},
   {...record,entries:[{...record.entries[0],annualCtcInr:100_000_001}]},
   {...record,entries:[{...record.entries[0],annualCtcInr:12.1}]},
   {...record,entries:[{...record.entries[0],applicationId:"other-tenant"}]},
   {...record,entries:[]},
   {...record,collegeId:b},
  ])expect(recordSelectionsSchema.safeParse(bad).success).toBe(false);
 });
 it("PLACEMENTS-SEL-SM-03 accepts only byte-for-byte persisted selection replays without duplicate rows or audit",()=>{
  const one={applicationId:a,roleTitle:"Graduate engineer",annualCtcInr:1_000_000};
  const two={applicationId:b,roleTitle:"QA engineer",annualCtcInr:null};
  const selected=[{...one,status:"SELECTED"},{...two,status:"SELECTED"}];
  expect(isExactTpoSelectionReplay(selected,[two,one])).toBe(true);
  expect(isExactTpoSelectionReplay(selected,[])).toBe(false);
  expect(isExactTpoSelectionReplay(selected,[one])).toBe(false);
  expect(isExactTpoSelectionReplay(selected,[one,one])).toBe(false);
  expect(isExactTpoSelectionReplay([{...one,status:"VERIFIED"},{...two,status:"SELECTED"}],[one,two])).toBe(false);
  expect(isExactTpoSelectionReplay(selected,[{...one,annualCtcInr:1_000_001},two])).toBe(false);
  expect(isExactTpoSelectionReplay(selected,[{...one,roleTitle:"Senior engineer"},two])).toBe(false);
 });
 it("PLACEMENTS-SEL-SM-07 accepts only selected row versions and rejects extra identifiers",()=>{
  expect(releaseSelectionsSchema.safeParse(release).success).toBe(true);
  for(const bad of [
    {...release,expectedRecordedAt:{[a]:timestamp,[b]:timestamp}},
    {...release,expectedRecordedAt:{[b]:timestamp}},
    {...release,expectedRecordedAt:{}},
    {...release,expectedRecordedAt:{[a]:timestamp,"not-a-uuid":timestamp}},
  ])expect(releaseSelectionsSchema.safeParse(bad).success).toBe(false);
  expect(releaseSelectionsSchema.safeParse({
    ...release,selectionIds:[a,b],expectedRecordedAt:{[a]:timestamp,[b]:timestamp},
  }).success).toBe(true);
 });
 it("PLACEMENTS-SEL-SM-02 forbids stale/missing review version, duplicate releases, and bypassed confirmation",()=>{
  expect(releaseSelectionsSchema.safeParse(release).success).toBe(true);
  for(const bad of [
   {...release,confirmed:false},
   {...release,expectedRecordedAt:{}},
   {...release,selectionIds:[a,a]},
   {...release,selectionIds:[a,b]},
   {...release,expectedRecordedAt:{[a]:"2026-99-99"}},
   {...release,actorUserId:b},
  ])expect(releaseSelectionsSchema.safeParse(bad).success).toBe(false);
  expect(summarizeSelectionRelease([{status:"released"},{status:"skipped",reason:"Stale"},{status:"released"}])).toEqual({released:2,skipped:1});
 });
});

describe("chat-5 placements core — offer state transition matrix",()=>{
 it("PLACEMENTS-OFFER-SM-01 enumerates every permitted and forbidden action on issued, accepted and terminal offers",()=>{
  const statuses=["ISSUED","ACCEPTED","DECLINED","WITHDRAWN","EXPIRED","CANCELLED"] as const;
  for(const action of TPO_OFFER_ACTIONS){
   for(const status of statuses){
    for(const joining of [null,"PENDING","JOINED","DID_NOT_JOIN"]){
     const expected=
      action==="EXTEND"||action==="RECORD_ACCEPTED"||action==="RECORD_DECLINED"?status==="ISSUED":
      action==="RECORD_JOINED"?status==="ACCEPTED"&&(joining===null||joining==="PENDING"):
      (status==="ISSUED"||status==="ACCEPTED")&&(status!=="ACCEPTED"||joining===null||joining==="PENDING");
     expect(canRecordTpoOfferAction(action,status,joining),`${action}/${status}/${joining}`).toBe(expected);
    }
   }
  }
 });
 it("PLACEMENTS-JOIN-SM-04 prevents future or malformed actual-joining records at IST midnight",()=>{
  const beforeMidnight=new Date("2099-10-18T18:29:59.999Z"); // 23:59:59.999 IST
  const afterMidnight=new Date("2099-10-18T18:30:00.000Z"); // 00:00 next day IST
  expect(canRecordTpoActualJoiningDate("2099-10-18",beforeMidnight)).toBe(true);
  expect(canRecordTpoActualJoiningDate("2099-10-19",beforeMidnight)).toBe(false);
  expect(canRecordTpoActualJoiningDate("2099-10-19",afterMidnight)).toBe(true);
  expect(canRecordTpoActualJoiningDate("2099-10-18",afterMidnight)).toBe(true);
  for(const invalid of ["2099-02-29","2099-02-30","2099-00-01","2099-13-01","", "2099-10-18T00:00:00Z"]){
   expect(canRecordTpoActualJoiningDate(invalid,afterMidnight),invalid).toBe(false);
  }
  expect(canRecordTpoActualJoiningDate("2099-10-18",new Date(Number.NaN))).toBe(false);
 });
 it("PLACEMENTS-OFFER-SM-02 rejects confirmation bypass, duplicated IDs, invalid date and action/payload mismatch",()=>{
  expect(tpoOfferLifecycleInputSchema.safeParse(offer).success).toBe(true);
  const changed=[
   {...offer,confirmed:false},
   {...offer,offerIds:[]},
   {...offer,offerIds:[a,a]},
   {...offer,offerIds:["bad"]},
   {...offer,reason:"short"},
   {...offer,collegeId:b},
   {...offer,joiningDate:"2099-02-30"},
   {...offer,expiresAt:timestamp},
   {...offer,action:"EXTEND"},
   {...offer,action:"RECORD_JOINED",expectedStatus:"ACCEPTED"},
  ];
  for(const bad of changed)expect(tpoOfferLifecycleInputSchema.safeParse(bad).success).toBe(false);
  expect(tpoOfferLifecycleInputSchema.safeParse({...offer,action:"EXTEND",expiresAt:timestamp}).success).toBe(true);
  expect(tpoOfferLifecycleInputSchema.safeParse({...offer,action:"RECORD_JOINED",expectedStatus:"ACCEPTED",joiningDate:"2099-02-28"}).success).toBe(true);
 });
});

describe("chat-5 placements core — cancellation, waitlist and joining",()=>{
 it("PLACEMENTS-CANCEL-SM-01 permits only draft or active published cancellation with the exact impact snapshot",()=>{
  const impact=cancel.expectedImpact;
  for(const [status,season,decision] of [
   ["DRAFT",null,"ALLOW"],["DRAFT","ENDED","ALLOW"],
   ["PUBLISHED","ACTIVE","ALLOW"],["PUBLISHED","CLOSED","READ_ONLY"],
   ["CLOSED","ACTIVE","READ_ONLY"],["CANCELLED","ACTIVE","READ_ONLY"]
  ] as const)expect(evaluateTpoDriveCancellation(status,season,impact,impact)).toBe(decision);
  expect(evaluateTpoDriveCancellation("PUBLISHED","ACTIVE",{...impact,issuedOffers:2},impact)).toBe("PREVIEW_STALE");
  expect(evaluateTpoDriveCancellation("PUBLISHED","ACTIVE",{...impact,acceptedOffers:1},impact)).toBe("PREVIEW_STALE");
  expect(isIssuedOfferCancelable("ISSUED")).toBe(true);
  for(const status of ["ACCEPTED","EXPIRED","WITHDRAWN","DECLINED"])expect(isIssuedOfferCancelable(status)).toBe(false);
 });
 it("PLACEMENTS-CANCEL-SM-02 rejects stale/malformed previews, unconfirmed cancellations and forged scope",()=>{
  expect(tpoDriveCancelSchema.safeParse(cancel).success).toBe(true);
  for(const bad of [
   {...cancel,confirmed:false},
   {...cancel,expectedUpdatedAt:"not-a-date"},
   {...cancel,expectedImpact:{...cancel.expectedImpact,openRounds:-1}},
   {...cancel,expectedImpact:{...cancel.expectedImpact,issuedOffers:0.1}},
   {...cancel,reason:"no"},
   {...cancel,collegeId:b},
  ])expect(tpoDriveCancelSchema.safeParse(bad).success).toBe(false);
 });
 it("PLACEMENTS-WAIT-SM-01 only explicitly reviewed, versioned promotions are accepted",()=>{
  const input={action:"OFFER_NEXT",confirmed:true,expectedPreviewToken:"a".repeat(64),reason:"Accepted the next waitlisted candidate"};
  expect(tpoWaitlistPromotionSchema.safeParse(input).success).toBe(true);
  for(const bad of [
   {...input,confirmed:false},
   {...input,expectedPreviewToken:"short"},
   {...input,reason:"no"},
   {...input,jobId:b},
  ])expect(tpoWaitlistPromotionSchema.safeParse(bad).success).toBe(false);
  const first=waitlistPreviewToken(a,{rank:1,seat:2});
  expect(first).toMatch(/^[0-9a-f]{64}$/);
  expect(waitlistPreviewToken(a,{rank:1,seat:2})).toBe(first);
  expect(waitlistPreviewToken(a,{rank:2,seat:2})).not.toBe(first);
  expect(waitlistPreviewToken(b,{rank:1,seat:2})).not.toBe(first);
 });
 it("PLACEMENTS-WAIT-TOKEN-04 ignores nondeterministic PostgreSQL ordering but detects real offer and reservation changes",()=>{
  const promotions=[
    {id:"promo-b",status:"PENDING",applicationId:b,seatNumber:2},
    {id:"promo-a",status:"RELEASED",applicationId:a,seatNumber:1},
  ];
  const offers=[
    {applicationId:b,kind:"OFFER"},
    {applicationId:a,kind:"LOI"},
    {applicationId:a,kind:"OFFER"},
  ];
  const initial=canonicalWaitlistPreviewCollections(promotions,offers);
  const reordered=canonicalWaitlistPreviewCollections([...promotions].reverse(),[...offers].reverse());
  expect(reordered).toEqual(initial);
  expect(waitlistPreviewToken(a,initial)).toBe(waitlistPreviewToken(a,reordered));
  const changed=canonicalWaitlistPreviewCollections(
    [{...promotions[0]!,status:"RELEASED"},promotions[1]!],offers);
  expect(waitlistPreviewToken(a,changed)).not.toBe(waitlistPreviewToken(a,initial));
  expect(waitlistPreviewToken(b,initial)).not.toBe(waitlistPreviewToken(a,initial));
  const service=readFileSync("src/modules/placements/tpo-waitlist-promotion-service.ts","utf8");
  expect(service).toContain("...canonicalWaitlistPreviewCollections(promotions,activeOffers)");
 });
 it("PLACEMENTS-WAIT-SEASON-05 checks persisted season twice, with a share lock before reserving seats",()=>{
  const service=readFileSync("src/modules/placements/tpo-waitlist-promotion-service.ts","utf8");
  expect(service).toContain("seasonStatus:placementSeasons.status");
  expect(service).toContain('if(job.seasonStatus!=="ACTIVE")reasons.push("Placement season is not active")');
  const reserve=service.slice(service.indexOf("export async function offerToNextWaitlisted"));
  const jobLock=reserve.indexOf('from(placementJobs).where(eq(placementJobs.id,preview.job.id)).for("update")');
  const seasonLock=reserve.indexOf('.from(placementSeasons).innerJoin(placementJobs');
  const seatRead=reserve.indexOf('const used=await tx.select');
  expect(jobLock).toBeGreaterThanOrEqual(0);
  expect(seasonLock).toBeGreaterThan(jobLock);
  expect(seatRead).toBeGreaterThan(seasonLock);
  expect(reserve).toContain('if(liveSeason?.status!=="ACTIVE")throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY")');
  expect(reserve.slice(seasonLock,seatRead)).toContain('.for("share").limit(1)');
  expect(reserve.slice(seasonLock,seatRead)).toContain('eq(placementSeasons.collegeId,context.membership!.collegeId)');
 });
 it("PLACEMENTS-WAIT-SM-03 settles exactly once under row lock and rejects conflicting terminal histories",()=>{
  const issuedOffer=a;
  expect(decideWaitlistReleaseSettlement("PENDING",null,issuedOffer)).toBe("WRITE");
  expect(decideWaitlistReleaseSettlement("RELEASED",issuedOffer,issuedOffer)).toBe("IDEMPOTENT");
  for(const [status,stored] of [
    ["PENDING",b],["RELEASED",null],["RELEASED",b],
    ["CANCELLED",null],["CANCELLED",issuedOffer],["UNKNOWN",null],
  ] as const){
    expect(decideWaitlistReleaseSettlement(status,stored,issuedOffer),status+"/"+stored).toBe("STALE");
  }
 });
 it("PLACEMENTS-JOIN-SM-01 counts accepted offer evidence only and never infers joining from an empty outcome",()=>{
  const issuedAt=new Date("2099-10-18T10:00:00.000Z");
  const base={offer:{id:a,status:"ACCEPTED",roleTitle:"Engineer",annualCtcInr:1_000_000,issuedAt},candidate:{membershipId:a,displayName:"  Alice "}};
  const result=projectTpoJoiningTracker([
   {...base,joining:null},
   {...base,offer:{...base.offer,id:b},joining:{status:"JOINED",joiningDate:"2099-12-01",reason:null}},
   {...base,offer:{...base.offer,id:"declined",status:"DECLINED"},joining:{status:"JOINED",joiningDate:"2099-12-01",reason:null}},
   {...base,offer:{...base.offer,id:"deferred"},joining:{status:"DEFERRED",joiningDate:null,reason:"Later"}},
  ]);
  expect(result.counts).toEqual({accepted:3,pending:1,joined:1,deferred:1,didNotJoin:0});
  expect(result.items[0]).toMatchObject({displayName:"Alice",joiningStatus:"PENDING",hasRecordedOutcome:false});
  expect(result.items[1]).toMatchObject({joiningStatus:"JOINED",hasRecordedOutcome:true});
  expect(result.items.find(row=>row.offerId==="declined")).toBeUndefined();
 });
});
