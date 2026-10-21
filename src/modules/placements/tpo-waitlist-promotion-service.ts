import "server-only";
import {and,asc,desc,eq,inArray,ne,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,placementJobRoleOptions,
 placementJobRounds,placementJobs,placementOffers,placementRoundResults,placementSeasons,users} from "@/db/schema";
import {placementWaitlistPromotions} from "@/db/schema/placement-waitlist-promotions";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {issuePlacementOffer} from "./offer-service";
import {requireTpoJobCollege,requireTpoJobActor,auditTpoJobChange} from "./tpo-job-write-base";
import {placementJobIdSchema} from "./validation";
import {tpoWaitlistPromotionSchema,waitlistPreviewToken,decideWaitlistReleaseSettlement,canonicalWaitlistPreviewCollections} from "./tpo-waitlist-promotion-model";

/** Historic IDs are provenance, not authorization. Map them using persisted,
 * unique source IDs AND the current TPO college before linking to vNext.
 * The legacy offer-next action operated on an offer; vNext reserves the next
 * free seat for the drive after checking all active offers and waitlist rows.
 */
export const TPO_LEGACY_WAITLIST_ROUTE_CROSSWALK=[
 {old:"GET /offers/{offerId}/offer-next-preview",
  current:"GET /api/placements/tpo/jobs/{jobId}/waitlist-promote",label:"Offer to next waitlisted",
  requirement:"Resolve legacyOfferId -> UUID offer -> current college-scoped job"},
 {old:"POST /offers/{offerId}/offer-next",
  current:"POST /api/placements/tpo/jobs/{jobId}/waitlist-promote",label:"Offer to next waitlisted",
  requirement:"Current expectedPreviewToken, confirmed action and audited reason"},
 {old:"POST /drives/{jobId}/auto-apply",
  current:"Drive round-results automatic apply",label:"Auto-apply",
  requirement:"Preserve pass-only automatic action; never silently mark missing students failed"},
] as const;
export const TPO_LEGACY_WAITLIST_STATUS_CROSSWALK={
 sourceWaitlisted:"HOLD",sourcePass:"PASS",sourceNotCleared:"FAIL",
 sourceOfferReleased:"ISSUED",sourceOfferAccepted:"ACCEPTED",
 sourceOfferDeclined:"DECLINED",sourceOfferExpired:"EXPIRED",
} as const;
const legacyPositiveId=(value:unknown)=>{
 if(typeof value==="number"&&Number.isSafeInteger(value)&&value>0)return value;
 if(typeof value==="string"&&/^[1-9][0-9]{0,9}$/.test(value)){
  const parsed=Number(value);return Number.isSafeInteger(parsed)?parsed:null;
 }
 return null;
};
/** For server-side legacy address redirects only. Missing/ambiguous historical
 * identities fail closed instead of being treated as current UUIDs.
 */
export async function resolveLegacyTpoWaitlistHref(
 context:RequestContext,input:{jobId?:unknown;offerId?:unknown;roundId?:unknown},
):Promise<string|null>{
 const collegeId=await requireTpoJobCollege(context),db=getDb();
 const oldJob=legacyPositiveId(input.jobId),oldOffer=legacyPositiveId(input.offerId),
  oldRound=legacyPositiveId(input.roundId);
 if(oldJob===null&&oldOffer===null&&oldRound===null)return null;
 const jobRows=oldOffer!==null
  ?await db.select({id:placementJobs.id}).from(placementOffers)
     .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
     .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
     .where(and(eq(placementOffers.legacyOfferId,oldOffer),eq(placementJobs.collegeId,collegeId)))
     .limit(2)
  :oldRound!==null
  ?await db.select({id:placementJobs.id}).from(placementJobRounds)
     .innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
     .where(and(eq(placementJobRounds.legacyRoundId,oldRound),eq(placementJobs.collegeId,collegeId)))
     .limit(2)
  :await db.select({id:placementJobs.id}).from(placementJobs)
     .where(and(eq(placementJobs.legacyJobId,oldJob!),eq(placementJobs.collegeId,collegeId)))
     .limit(2);
 if(jobRows.length!==1)return null;
 const jobId=jobRows[0]!.id;
 // If a bookmark supplied more than one ID they must resolve to ONE job.
 if(oldJob!==null){
  const [check]=await db.select({id:placementJobs.id}).from(placementJobs)
   .where(and(eq(placementJobs.legacyJobId,oldJob),eq(placementJobs.id,jobId),
    eq(placementJobs.collegeId,collegeId))).limit(1);
  if(!check)return null;
 }
 if(oldRound!==null){
  const [check]=await db.select({id:placementJobRounds.id}).from(placementJobRounds)
   .where(and(eq(placementJobRounds.legacyRoundId,oldRound),
    eq(placementJobRounds.jobId,jobId))).limit(1);
  if(!check)return null;
 }
 return "/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/waitlist";
}

export async function getTpoWaitlistPreview(context:RequestContext,rawJobId:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const [job]=await getDb().select({
  id:placementJobs.id,title:placementJobs.title,status:placementJobs.status,
  openings:placementJobs.openings,updatedAt:placementJobs.updatedAt,
  seasonStatus:placementSeasons.status,
 }).from(placementJobs).innerJoin(placementSeasons,and(
  eq(placementSeasons.id,placementJobs.seasonId),eq(placementSeasons.collegeId,collegeId),
 )).where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const storageReady=true; // registered in 0113
 const rounds=await getDb().select({
  id:placementJobRounds.id,sequence:placementJobRounds.sequence,status:placementJobRounds.status,
 }).from(placementJobRounds).where(and(eq(placementJobRounds.jobId,jobId),
  ne(placementJobRounds.kind,"TALK"),ne(placementJobRounds.status,"CANCELLED")))
 .orderBy(asc(placementJobRounds.sequence));
 const last=rounds.at(-1);
 const waitlist=last?await getDb().select({
  applicationId:placementApplications.id,rank:placementRoundResults.waitlistRank,
  name:users.displayName,roleTitle:placementJobRoleOptions.title,
  annualCtcInr:placementJobRoleOptions.maximumAnnualCtcInr,
  applicationStatus:placementApplications.status,screeningStatus:placementApplicationScreenings.status,
 }).from(placementRoundResults)
  .innerJoin(placementApplications,eq(placementApplications.id,placementRoundResults.applicationId))
  .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .innerJoin(placementJobRoleOptions,eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
    eq(collegeMemberships.collegeId,collegeId)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(placementRoundResults.roundId,last.id),
   eq(placementRoundResults.status,"APPLIED"),eq(placementRoundResults.outcome,"HOLD"),
   eq(placementApplications.jobId,jobId)))
  .orderBy(asc(placementRoundResults.waitlistRank),asc(placementApplications.id)):[];
 const prior=rounds.length>1&&waitlist.length?await getDb().select({
  applicationId:placementRoundResults.applicationId,roundId:placementRoundResults.roundId,
  outcome:placementRoundResults.outcome,
 }).from(placementRoundResults).where(and(
  inArray(placementRoundResults.applicationId,waitlist.map(w=>w.applicationId)),
  inArray(placementRoundResults.roundId,rounds.slice(0,-1).map(r=>r.id)),
  eq(placementRoundResults.status,"APPLIED"))):[];
 const activeOffers=await getDb().select({applicationId:placementOffers.applicationId,kind:placementOffers.kind})
  .from(placementOffers).innerJoin(placementApplications,
   eq(placementApplications.id,placementOffers.applicationId))
  .where(and(eq(placementApplications.jobId,jobId),
   inArray(placementOffers.status,["ISSUED","ACCEPTED"])));
 const promotions=storageReady?await getDb().select().from(placementWaitlistPromotions)
  .where(eq(placementWaitlistPromotions.jobId,jobId)):[];
 const held=new Set(activeOffers.map(x=>x.applicationId));
 const promoByApplication=new Map(promotions.map(x=>[x.applicationId,x]));
 const reservedCount=promotions.filter(p=>p.status==="PENDING").length;
 const occupiedOfferSeats=activeOffers.filter(offer=>offer.kind==="OFFER").length;
 const freeSeats=job.openings==null?null:Math.max(0,job.openings-occupiedOfferSeats-reservedCount);
 const rankCounts=new Map<number,number>();
 for(const candidate of waitlist){if(candidate.rank!==null)
  rankCounts.set(candidate.rank,(rankCounts.get(candidate.rank)??0)+1);}
 const rows=waitlist.map(w=>{
  const reasons:string[]=[];
  const existing=promoByApplication.get(w.applicationId);
  if(w.rank===null||w.rank<1)reasons.push("Waitlist rank missing");
  else if((rankCounts.get(w.rank)??0)>1)reasons.push("Duplicate waitlist rank requires correction");
  // Released promotions must never win the "next" ranking again.
  if(existing?.status==="RELEASED")reasons.push("An offer was already released to this waitlisted learner");
  if(w.applicationStatus!=="SUBMITTED"||w.screeningStatus!=="SHORTLISTED")
   reasons.push("Application is no longer shortlisted");
  if(held.has(w.applicationId)&&!existing)reasons.push("Already holds an active offer");
  if(rounds.some(r=>r.status!=="COMPLETED"))reasons.push("Round results are not complete");
  if(!last||rounds.slice(0,-1).some(r=>!prior.some(p=>p.applicationId===w.applicationId&&p.roundId===r.id&&p.outcome==="PASS")))
   reasons.push("An earlier round was not cleared");
  if(!existing&&freeSeats!==null&&freeSeats<1)reasons.push("No open offer seat");
  if(!existing&&promotions.some(p=>p.applicationId===w.applicationId))reasons.push("Already promoted");
  if(job.status!=="PUBLISHED")reasons.push("Drive is not live");
  if(job.seasonStatus!=="ACTIVE")reasons.push("Placement season is not active");
   return {applicationId:w.applicationId,name:w.name??"Learner",roleTitle:w.roleTitle,
   annualCtcInr:w.annualCtcInr,rank:w.rank??0,reason:existing?.reason??null,
   promotionStatus:existing?.status??null,reasons,canPromote:reasons.length===0};
 });
 const next=rows.find(row=>row.canPromote)??null;
 const token=waitlistPreviewToken(jobId,{
  updatedAt:job.updatedAt.toISOString(),rounds,
  ...canonicalWaitlistPreviewCollections(promotions,activeOffers),
  rows,freeSeats,
 });
 return {job:{...job,updatedAt:job.updatedAt.toISOString()},lastRoundId:last?.id??null,
  storageReady,freeSeats,activeOffers:occupiedOfferSeats,rows,next,previewToken:token};
}
export async function offerToNextWaitlisted(context:RequestContext,rawJobId:unknown,raw:unknown){
 const input=tpoWaitlistPromotionSchema.parse(raw);
 const preview=await getTpoWaitlistPreview(context,rawJobId);
 if(input.expectedPreviewToken!==preview.previewToken)throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
 const next=preview.next;
 if(!next||!preview.lastRoundId)throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
 if(next.promotionStatus==="RELEASED")
  throw new PlacementsServiceError("PLACEMENT_OFFER_ACTIVE_EXISTS");
 const existing=await getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [locked]=await tx.select({status:placementJobs.status,openings:placementJobs.openings})
   .from(placementJobs).where(eq(placementJobs.id,preview.job.id)).for("update").limit(1);
  if(locked?.status!=="PUBLISHED")throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
  // Use the same job-before-season locking order as the canonical issuer.
  // Never reserve a seat when the owning season has closed after preview.
  const [liveSeason]=await tx.select({status:placementSeasons.status})
   .from(placementSeasons).innerJoin(placementJobs,
    eq(placementJobs.seasonId,placementSeasons.id))
   .where(and(eq(placementJobs.id,preview.job.id),
    eq(placementJobs.collegeId,context.membership!.collegeId),
    eq(placementSeasons.collegeId,context.membership!.collegeId)))
   .for("share").limit(1);
  if(liveSeason?.status!=="ACTIVE")throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
  const [prior]=await tx.select().from(placementWaitlistPromotions).where(and(
   eq(placementWaitlistPromotions.jobId,preview.job.id),
   eq(placementWaitlistPromotions.applicationId,next.applicationId))).limit(1);
  if(prior){
   if(prior.roundId!==preview.lastRoundId||prior.waitlistRank!==next.rank)
    throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
   return prior;
  }
  const used=await tx.select({number:placementWaitlistPromotions.seatNumber})
   .from(placementWaitlistPromotions).where(eq(placementWaitlistPromotions.jobId,preview.job.id));
  const active=await tx.select({id:placementOffers.id}).from(placementOffers)
   .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
   .where(and(eq(placementApplications.jobId,preview.job.id),
    eq(placementOffers.kind,"OFFER"),
    inArray(placementOffers.status,["ISSUED","ACCEPTED"])));
  // Physical capacity is occupied by active offers and pending reservations,
  // not every historic promotion: a declined offer frees one opening.
  const reserved=await tx.select({id:placementWaitlistPromotions.id})
   .from(placementWaitlistPromotions).where(and(
    eq(placementWaitlistPromotions.jobId,preview.job.id),
    eq(placementWaitlistPromotions.status,"PENDING")));
  if(locked.openings!==null&&active.length+reserved.length>=locked.openings)
   throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_READY");
  const seats=new Set(used.map(x=>x.number));
  let seat=1;while(seats.has(seat))seat++;
  const [saved]=await tx.insert(placementWaitlistPromotions).values({
   jobId:preview.job.id,roundId:preview.lastRoundId!,applicationId:next.applicationId,
   seatNumber:seat,waitlistRank:next.rank,reason:input.reason,
   promotedByUserId:context.user.id,
  }).returning();
  await auditTpoJobChange(tx,context,{id:preview.job.id,title:preview.job.title},
   "PLACEMENTS_TPO_WAITLIST_PROMOTED","promoted waitlisted applicant for",{
    applicationId:next.applicationId,roundId:preview.lastRoundId,rank:next.rank,seatNumber:seat,
   });
  return saved;
 });
 if(existing.status==="RELEASED"&&existing.offerId)
  return {promoted:1,offerId:existing.offerId,seatNumber:existing.seatNumber};
 // An earlier issuance can have committed before recording RELEASED. Never
 // issue another offer when the application already holds one.
 const active=await getDb().select({
  id:placementOffers.id,kind:placementOffers.kind,roleTitle:placementOffers.roleTitle,
  annualCtcInr:placementOffers.annualCtcInr,issuedAt:placementOffers.issuedAt,
 }).from(placementOffers).where(and(
  eq(placementOffers.applicationId,next.applicationId),
  inArray(placementOffers.status,["ISSUED","ACCEPTED"]))).limit(2);
 if(active.length){
  const found=active.length===1&&active[0]!.issuedAt>=existing.promotedAt&&
   active[0]!.kind==="OFFER"&&
   active[0]!.roleTitle===next.roleTitle&&active[0]!.annualCtcInr===next.annualCtcInr
   ?active[0]:null;
  if(!found)throw new PlacementsServiceError("PLACEMENT_OFFER_ACTIVE_EXISTS");
  await getDb().transaction(async tx=>{
   await requireTpoJobActor(tx,context);
   const [settling]=await tx.select({
    status:placementWaitlistPromotions.status,offerId:placementWaitlistPromotions.offerId,
   }).from(placementWaitlistPromotions).where(eq(placementWaitlistPromotions.id,existing.id))
    .for("update").limit(1);
   const decision=decideWaitlistReleaseSettlement(settling?.status??"",settling?.offerId??null,found.id);
   if(decision==="STALE")throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
   if(decision==="IDEMPOTENT")return;
   const [saved]=await tx.update(placementWaitlistPromotions).set({
    status:"RELEASED",offerId:found.id,releasedAt:new Date(),
   }).where(and(eq(placementWaitlistPromotions.id,existing.id),
    eq(placementWaitlistPromotions.status,"PENDING"))).returning({id:placementWaitlistPromotions.id});
   if(!saved)throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
   await auditTpoJobChange(tx,context,{id:preview.job.id,title:preview.job.title},
    "PLACEMENTS_TPO_WAITLIST_PROMOTED","reconciled offer for waitlisted applicant",{
     applicationId:next.applicationId,offerId:found.id,seatNumber:existing.seatNumber,
    });
  });
  return {promoted:1,offerId:found.id,seatNumber:existing.seatNumber};
 }
 const offer=await issuePlacementOffer(context,next.applicationId,{
  kind:"OFFER",roleTitle:next.roleTitle,annualCtcInr:next.annualCtcInr,
 });
 await getDb().transaction(async tx=>{
  await requireTpoJobActor(tx,context);
  const [settling]=await tx.select({
   status:placementWaitlistPromotions.status,offerId:placementWaitlistPromotions.offerId,
  }).from(placementWaitlistPromotions).where(eq(placementWaitlistPromotions.id,existing.id))
   .for("update").limit(1);
  const decision=decideWaitlistReleaseSettlement(settling?.status??"",settling?.offerId??null,offer.id);
  if(decision==="STALE")throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
  if(decision==="IDEMPOTENT")return;
  const [saved]=await tx.update(placementWaitlistPromotions).set({
   status:"RELEASED",offerId:offer.id,releasedAt:new Date(),
  }).where(and(eq(placementWaitlistPromotions.id,existing.id),
   eq(placementWaitlistPromotions.status,"PENDING"))).returning({id:placementWaitlistPromotions.id});
  if(!saved)throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
 });
 return {promoted:1,offerId:offer.id,seatNumber:existing.seatNumber};
}
