import {describe,expect,it} from "vitest";
import {evaluateTpoDriveLifecycle,hasSecureEmployerPortalUrl,tpoDriveLifecycleSchema,tpoDriveReadinessMessage,type TpoDriveReadinessFacts} from "@/modules/placements/tpo-drive-lifecycle-model";
import {canReleaseAnotherHeldOffer,isPlacementOfferResponseExpired,minimumOfferResponseDeadline,placementOfferLockedDecisionTime,canReplayFinalOfferResponseAfterExpiry} from "@/modules/placements/offer-college-rules-policy";
import {canAddPlacementHeldOffer,canShowLearnerSelfApply,verifiedExternalHeldOffers} from "@/modules/placements/held-offer-policy";
import {isPlacementInternship,parsePlacementCascadeId,shouldKeepPlacementCascadeSibling} from "@/modules/placements/placement-cascade-policy";
import {assertUndoablePlacementCascadeSnapshot} from "@/modules/placements/placement-cascade-undo-policy";
import {isIssuedPlacementOfferDue,selectDuePlacementOfferIds} from "@/modules/placements/placement-offer-sweep-policy";
import {isPlacementOfferExpiredAt} from "@/modules/placements/placement-expiry-staged-policy";

const facts:TpoDriveReadinessFacts={
 jobStatus:"DRAFT",seasonActive:true,companyActive:true,roleCount:1,
 evaluativeRoundCount:1,policyPersisted:true,deadlineValid:true,
 deadlinePresent:true,payPresent:true,externalUrlPresent:true,
 appliedResultCount:0,acceptedOfferCount:0,
};
const due=new Date("2099-10-18T18:29:59.000Z");
const afterDue=new Date("2099-10-18T18:29:59.001Z");
const cascadeId="11111111-1111-4111-8111-111111111111";

describe("chat-5 core placement drive transition invariants",()=>{
 it.each([["PUBLISH","PUBLISHED"],["CLOSE","CLOSED"],["REOPEN","PUBLISHED"]] as const)(
 "PLACEMENTS-LIFECYCLE-01 rejects stale %s state", (action,wrong)=>{
  const result=evaluateTpoDriveLifecycle(action,{...facts,jobStatus:wrong});
  expect(result.allowed).toBe(false);
  expect(result.blockers).toContain("STALE_JOB_STATUS");
 });
 it.each([
  ["seasonActive",false,"SEASON_NOT_ACTIVE"],
  ["companyActive",false,"COMPANY_NOT_ACTIVE"],
  ["roleCount",0,"NO_ACTIVE_ROLE"],
  ["evaluativeRoundCount",0,"NO_EVALUATIVE_ROUND"],
  ["policyPersisted",false,"ELIGIBILITY_POLICY_NOT_PERSISTED"],
  ["deadlinePresent",false,"APPLICATION_DEADLINE_MISSING"],
  ["deadlineValid",false,"APPLICATION_DEADLINE_PASSED"],
  ["payPresent",false,"PACKAGE_MISSING"],
  ["externalUrlPresent",false,"EXTERNAL_APPLICATION_LINK_MISSING"],
 ] as const)("PLACEMENTS-LIFECYCLE-02 refuses publish when %s is invalid",(key,value,blocker)=>{
  const result=evaluateTpoDriveLifecycle("PUBLISH",{...facts,[key]:value});
  expect(result.allowed).toBe(false);
  expect(result.blockers).toContain(blocker);
  expect(tpoDriveReadinessMessage(blocker)).not.toMatch(/^[A-Z_]+$/);
 });
 it("PLACEMENTS-CLOSE-01 closeout works even after season and company become inactive",()=>{
  expect(evaluateTpoDriveLifecycle("CLOSE",{...facts,jobStatus:"PUBLISHED",
   seasonActive:false,companyActive:false,roleCount:0,deadlineValid:false,
   payPresent:false,externalUrlPresent:false})).toEqual({allowed:true,blockers:[]});
  expect(evaluateTpoDriveLifecycle("REOPEN",{...facts,jobStatus:"CLOSED",seasonActive:false}).blockers)
   .toContain("SEASON_NOT_ACTIVE");
 });
 it("PLACEMENTS-LIFECYCLE-03 prevents reopen after results and accepted offers",()=>{
  expect(evaluateTpoDriveLifecycle("REOPEN",{...facts,jobStatus:"CLOSED"}).allowed).toBe(true);
  expect(evaluateTpoDriveLifecycle("REOPEN",{...facts,jobStatus:"CLOSED",
   appliedResultCount:1,acceptedOfferCount:1}).blockers)
   .toEqual(["APPLIED_RESULTS_EXIST","ACCEPTED_OFFERS_EXIST"]);
 });
 it("PLACEMENTS-LIFECYCLE-04 confirmation is strict and requires a meaningful reason",()=>{
  const valid={action:"PUBLISH",expectedStatus:"DRAFT",confirmed:true,
   reason:"All eligibility checks passed"};
  expect(tpoDriveLifecycleSchema.safeParse(valid).success).toBe(true);
  for(const change of [{confirmed:false},{confirmed:undefined},{reason:"short"},{collegeId:"forged"}])
   expect(tpoDriveLifecycleSchema.safeParse({...valid,...change}).success).toBe(false);
 });
 it.each([
  ["EXTERNAL","http://employer.example",false],
  ["EXTERNAL","https://user:pass@employer.example/apply",false],
  ["EXTERNAL","javascript:alert(1)",false],
  ["EXTERNAL","/relative",false],
  ["EXTERNAL","",false],
  ["EXTERNAL","https://employer.example/apply",true],
  ["INTERNAL",null,true],
 ] as const)("PLACEMENTS-LIFECYCLE-05 portal URL %s %s",(mode,url,valid)=>{
  expect(hasSecureEmployerPortalUrl(mode,url)).toBe(valid);
 });
});

describe("chat-5 offers, waitlist eligibility, expiry and cascade invariants",()=>{
 const cap={maxHeldOffers:1,upliftPct:20,heldOffers:[{annualCtcInr:1_000_000}]};
 it("PLACEMENTS-HELD-01 enforces salary uplift boundary, dream exception and unknown salary",()=>{
  expect(canReleaseAnotherHeldOffer({...cap,annualCtcInr:1_199_999,isDreamDrive:false})).toBe(false);
  expect(canReleaseAnotherHeldOffer({...cap,annualCtcInr:1_200_000,isDreamDrive:false})).toBe(true);
  expect(canReleaseAnotherHeldOffer({...cap,annualCtcInr:null,isDreamDrive:false})).toBe(false);
  expect(canReleaseAnotherHeldOffer({...cap,annualCtcInr:null,isDreamDrive:true})).toBe(true);
  expect(canReleaseAnotherHeldOffer({...cap,heldOffers:[],annualCtcInr:null,isDreamDrive:false})).toBe(true);
 });
 it("PLACEMENTS-HELD-02 LOIs and declined offers never consume official held-offer cap",()=>{
  const heldOffers=[{kind:"LOI",status:"ISSUED",annualCtcInr:2_000_000},
   {kind:"OFFER",status:"DECLINED",annualCtcInr:2_000_000}];
  expect(canAddPlacementHeldOffer({maxHeldOffers:1,upliftPct:20,nextAnnualCtcInr:null,
   isDream:false,heldOffers})).toBe(true);
  expect(canAddPlacementHeldOffer({maxHeldOffers:1,upliftPct:20,nextAnnualCtcInr:null,
   isDream:false,heldOffers:[...heldOffers,{kind:"OFFER",status:"ACCEPTED",annualCtcInr:1_000_000}]})).toBe(false);
 });
 it("PLACEMENTS-HELD-03 revoked or unreviewed outside offers never count",()=>{
  const reviewedAt=new Date("2099-01-01T00:00:00.000Z");
  const rows=[
   {status:"VERIFIED",reviewedByUserId:"reviewer",reviewedAt,revokedAt:null,ctcLpa:"12"},
   {status:"VERIFIED",reviewedByUserId:"reviewer",reviewedAt,revokedAt:reviewedAt,ctcLpa:"30"},
   {status:"PENDING",reviewedByUserId:"reviewer",reviewedAt,revokedAt:null,ctcLpa:"50"},
   {status:"VERIFIED",reviewedByUserId:null,reviewedAt,revokedAt:null,ctcLpa:"25"},
  ];
  expect(verifiedExternalHeldOffers(rows)).toEqual([{kind:"OFFER",status:"ACCEPTED",annualCtcInr:1_200_000}]);
 });
 it("PLACEMENTS-HELD-04 self-apply requires registration, rights and eligibility",()=>{
  const base={registrationState:"CAN_APPLY" as const,debarred:false,canSelfApply:true,
   hasApplication:false,deadlinePassed:false,eligibilityStatus:"ELIGIBLE",heldOfferEligible:true};
  expect(canShowLearnerSelfApply(base)).toBe(true);
  for(const change of [{registrationState:"REGISTER_FIRST" as const},{debarred:true},
   {hasApplication:true},{canSelfApply:false},{deadlinePassed:true},{heldOfferEligible:false}])
   expect(canShowLearnerSelfApply({...base,...change})).toBe(false);
 });
 it("PLACEMENTS-OFFER-RETRY-05 permits exact same-actor, already-durable response retries after expiry only",()=>{
  const facts={status:"ACCEPTED",respondedByUserId:"learner-A",actorUserId:"learner-A"} as const;
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"ACCEPT"})).toBe(true);
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"DECLINE"})).toBe(false);
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"WITHDRAW"})).toBe(false);
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"ACCEPT",actorUserId:"learner-B"})).toBe(false);
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"ACCEPT",respondedByUserId:null})).toBe(false);
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"ACCEPT",status:"ISSUED"})).toBe(false);
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"ACCEPT",status:"WITHDRAWN"})).toBe(false);
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"DECLINE",status:"DECLINED"})).toBe(true);
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"ACCEPT",status:"DECLINED"})).toBe(false);
  expect(canReplayFinalOfferResponseAfterExpiry({...facts,action:"DECLINE",status:"ACCEPTED"})).toBe(false);
 });
 it("PLACEMENTS-EXPIRY-01 exact expiry is not actionable, including invalid Date",()=>{
  expect(isPlacementOfferResponseExpired(due,new Date(due.getTime()-1))).toBe(false);
  expect(isPlacementOfferResponseExpired(due,due)).toBe(true);
  expect(isPlacementOfferExpiredAt(due,due)).toBe(true);
  expect(isPlacementOfferExpiredAt(new Date(Number.NaN),due)).toBe(true);
  expect(isPlacementOfferResponseExpired(new Date(Number.NaN),due)).toBe(true);
  expect(isPlacementOfferExpiredAt(null,due)).toBe(false);
 });
 it("PLACEMENTS-EXPIRY-RACE-04 rejects a response that crossed its deadline while waiting on a locked offer row",()=>{
  const requestTime=new Date("2099-10-18T18:29:58.000Z");
  const lockTime=new Date("2099-10-18T18:29:59.000Z");
  const beforeLock=new Date("2099-10-18T18:29:57.000Z");
  expect(placementOfferLockedDecisionTime(requestTime,lockTime)).toEqual(lockTime);
  expect(placementOfferLockedDecisionTime(requestTime,beforeLock)).toEqual(requestTime);
  expect(isPlacementOfferResponseExpired(lockTime,requestTime)).toBe(false);
  expect(isPlacementOfferResponseExpired(lockTime,placementOfferLockedDecisionTime(requestTime,lockTime))).toBe(true);
  expect(isPlacementOfferResponseExpired(lockTime,new Date(Number.NaN))).toBe(true);
  expect(()=>placementOfferLockedDecisionTime(requestTime,new Date(Number.NaN))).toThrow();
  expect(()=>placementOfferLockedDecisionTime(new Date(Number.NaN),lockTime)).toThrow();
  expect(isPlacementOfferResponseExpired(null,new Date(Number.NaN))).toBe(false);
 });
 it("PLACEMENTS-EXPIRY-02 sweep ignores later, accepted and undated offers",()=>{
  const rows=[{id:"early",status:"ISSUED",expiresAt:due},
   {id:"later",status:"ISSUED",expiresAt:afterDue},
   {id:"accepted",status:"ACCEPTED",expiresAt:due},
   {id:"missing",status:"ISSUED",expiresAt:null}];
  expect(selectDuePlacementOfferIds(rows,due)).toEqual(["early"]);
  expect(isIssuedPlacementOfferDue(rows[1]!,due)).toBe(false);
  expect(selectDuePlacementOfferIds(rows,afterDue)).toEqual(["early","later"]);
 });
 it("PLACEMENTS-EXPIRY-SM-04 never treats invalid scheduler time or offer expiry as a valid due batch",()=>{
  const invalid=new Date(Number.NaN);
  const rows=[
   {id:"due",status:"ISSUED",expiresAt:due},
   {id:"not-a-date",status:"ISSUED",expiresAt:invalid},
   {id:"terminal",status:"EXPIRED",expiresAt:due},
  ];
  expect(selectDuePlacementOfferIds(rows,due)).toEqual(["due"]);
  expect(selectDuePlacementOfferIds(rows,invalid)).toEqual([]);
  for(const row of rows)expect(isIssuedPlacementOfferDue(row,invalid)).toBe(false);
  expect(isIssuedPlacementOfferDue(rows[1]!,due)).toBe(false);
  expect(isIssuedPlacementOfferDue(rows[2]!,due)).toBe(false);
 });
 it("PLACEMENTS-EXPIRY-03 minimum response clock excludes IST Sunday exactly",()=>{
  const saturday2330=new Date("2099-10-17T18:00:00.000Z");
  expect(minimumOfferResponseDeadline(saturday2330,1).toISOString())
   .toBe("2099-10-18T19:00:00.000Z");
  expect(()=>minimumOfferResponseDeadline(saturday2330,0)).toThrow();
  expect(()=>minimumOfferResponseDeadline(new Date(Number.NaN),1)).toThrow();
 });
 it("PLACEMENTS-CASCADE-01 validates cascade marker rather than substring",()=>{
  expect(parsePlacementCascadeId("placed elsewhere; cascade:"+cascadeId)).toBe(cascadeId);
  expect(parsePlacementCascadeId("cascade:"+cascadeId.toUpperCase())).toBe(cascadeId);
  expect(parsePlacementCascadeId("not-a-cascade:"+cascadeId)).toBeNull();
 });
 it("PLACEMENTS-CASCADE-02 internship, dream and uplift siblings survive",()=>{
  const base={acceptedCountsAsPlaced:true,siblingIsInternship:false,siblingIsDream:false,
   siblingAnnualCtcInr:400_000,acceptedAnnualCtcInr:1_000_000,maxHeldOffers:1,upliftPct:20};
  expect(shouldKeepPlacementCascadeSibling(base)).toBe(false);
  expect(shouldKeepPlacementCascadeSibling({...base,siblingIsInternship:true})).toBe(true);
  expect(shouldKeepPlacementCascadeSibling({...base,siblingIsDream:true})).toBe(true);
  expect(shouldKeepPlacementCascadeSibling({...base,siblingAnnualCtcInr:1_200_000})).toBe(true);
  expect(shouldKeepPlacementCascadeSibling({...base,acceptedCountsAsPlaced:false})).toBe(true);
  expect(isPlacementInternship(" internship ")).toBe(true);
 });
 it("PLACEMENTS-CASCADE-03 undo refuses changed offers, joined learner and foreign cascade",()=>{
  const base={acceptedStatus:"ACCEPTED",acceptedHistoryReason:"cascade:"+cascadeId,
   cascadeId,joiningStatus:"PENDING",joiningHasHistory:false,
   siblingOfferStatuses:["DECLINED"],siblingApplicationStatuses:["WITHDRAWN"]};
  expect(()=>assertUndoablePlacementCascadeSnapshot(base)).not.toThrow();
  for(const change of [{acceptedStatus:"ISSUED"},{acceptedHistoryReason:"cascade:other"},
   {joiningStatus:"JOINED"},{joiningHasHistory:true},
   {siblingOfferStatuses:["ISSUED"]},{siblingApplicationStatuses:["SUBMITTED"]}])
   expect(()=>assertUndoablePlacementCascadeSnapshot({...base,...change})).toThrow();
 });
});
