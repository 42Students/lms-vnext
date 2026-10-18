import {randomUUID} from "node:crypto";
import {and,eq,inArray,ne} from "drizzle-orm";
import {
 placementApplications,placementApplicationStatusHistory,placementCollegeRules,
 placementJobRoleOptions,placementJobs,placementOffers,placementOfferStatusHistory,
} from "@/db/schema";
import {PlacementsServiceError} from "./errors";
import {isPlacementInternship,shouldKeepPlacementCascadeSibling} from "./placement-cascade-policy";
import type {TpoJobTx} from "./tpo-job-write-base";

/** Administrative acceptance must obey the SAME college-scoped sibling
 * cascade as the canonical learner ACCEPT. Never impersonate the learner;
 * all mutations and history remain attributed to the TPO evidence actor.
 * The caller already holds the learner membership mutex and accepted offer.
 */
export async function cascadeTpoRecordedAcceptance(tx:TpoJobTx,input:{
 actorUserId:string;membershipId:string;collegeId:string;
 offer:{id:string;applicationId:string;kind:string;annualCtcInr:number|null};
 now:Date;
}):Promise<{cascadeId:string;cascadedOfferCount:number;withdrawnApplicationCount:number}>{
 const [accepted]=await tx.select({
  applicationId:placementApplications.id,
  jobEmploymentType:placementJobs.employmentType,
  roleEmploymentType:placementJobRoleOptions.employmentType,
 }).from(placementApplications)
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .innerJoin(placementJobRoleOptions,eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
  .where(and(eq(placementApplications.id,input.offer.applicationId),
   eq(placementApplications.membershipId,input.membershipId),
   eq(placementJobs.collegeId,input.collegeId))).limit(1);
 if(!accepted)throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_FOUND");
 const [rules]=await tx.select({
  maxHeldOffers:placementCollegeRules.maxHeldOffers,
  upliftPct:placementCollegeRules.upliftPct,
 }).from(placementCollegeRules).where(eq(placementCollegeRules.collegeId,input.collegeId))
  .for("share").limit(1);
 const acceptedCountsAsPlaced=input.offer.kind==="OFFER" &&
  !isPlacementInternship(accepted.jobEmploymentType) &&
  !isPlacementInternship(accepted.roleEmploymentType);
 const wouldKeep=(sibling:{
  roleEmploymentType:string;jobEmploymentType:string;isDream:boolean;
  annualCtcInr:number|null;
 })=>shouldKeepPlacementCascadeSibling({
  acceptedCountsAsPlaced,
  siblingIsInternship:isPlacementInternship(sibling.roleEmploymentType)||
   isPlacementInternship(sibling.jobEmploymentType),
  siblingIsDream:sibling.isDream,
  siblingAnnualCtcInr:sibling.annualCtcInr,
  acceptedAnnualCtcInr:input.offer.annualCtcInr,
  maxHeldOffers:rules?.maxHeldOffers??1,
  upliftPct:rules?.upliftPct??40,
 });
 const otherOffers=await tx.select({
  id:placementOffers.id,status:placementOffers.status,kind:placementOffers.kind,
  annualCtcInr:placementOffers.annualCtcInr,
  roleEmploymentType:placementJobRoleOptions.employmentType,
  jobEmploymentType:placementJobs.employmentType,
  isDream:placementJobs.isDream,
 }).from(placementOffers)
  .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
  .innerJoin(placementJobRoleOptions,eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .where(and(eq(placementApplications.membershipId,input.membershipId),
   eq(placementJobs.collegeId,input.collegeId),
   ne(placementOffers.id,input.offer.id),
   inArray(placementOffers.status,["ISSUED","ACCEPTED"])))
  .for("update");
 if(otherOffers.some(row=>row.status==="ACCEPTED"))
  throw new PlacementsServiceError("PLACEMENT_OFFER_ACTIVE_EXISTS");
 const cascadeId=randomUUID();
 const declined=otherOffers.filter(row=>row.status==="ISSUED"&&row.kind==="OFFER"&&!wouldKeep(row));
 for(const sibling of declined){
  const [updated]=await tx.update(placementOffers).set({
   status:"DECLINED",respondedByUserId:input.actorUserId,
   respondedAt:input.now,updatedAt:input.now,
  }).where(and(eq(placementOffers.id,sibling.id),eq(placementOffers.status,"ISSUED")))
   .returning({id:placementOffers.id});
  if(!updated)throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
  await tx.insert(placementOfferStatusHistory).values({
   offerId:updated.id,fromStatus:"ISSUED",toStatus:"DECLINED",
   actorUserId:input.actorUserId,
   reason:"placed elsewhere; cascade:"+cascadeId,cascadeId,
  });
 }
 const siblingApplications=await tx.select({
  id:placementApplications.id,
  annualCtcInr:placementJobRoleOptions.minimumAnnualCtcInr,
  jobAnnualCtcInr:placementJobs.minimumAnnualCtcInr,
  roleEmploymentType:placementJobRoleOptions.employmentType,
  jobEmploymentType:placementJobs.employmentType,
  isDream:placementJobs.isDream,
 }).from(placementApplications)
  .innerJoin(placementJobRoleOptions,eq(placementJobRoleOptions.id,placementApplications.roleOptionId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .where(and(eq(placementApplications.membershipId,input.membershipId),
   eq(placementJobs.collegeId,input.collegeId),
   ne(placementApplications.id,accepted.applicationId),
   eq(placementApplications.status,"SUBMITTED")))
  .for("update");
 const withdrawIds=siblingApplications.filter(row=>!wouldKeep({
  ...row,annualCtcInr:row.annualCtcInr??row.jobAnnualCtcInr,
 })).map(row=>row.id);
 const withdrawn=withdrawIds.length?await tx.update(placementApplications).set({
  status:"WITHDRAWN",withdrawnAt:input.now,updatedAt:input.now,
 }).where(and(inArray(placementApplications.id,withdrawIds),
  eq(placementApplications.status,"SUBMITTED"))).returning({id:placementApplications.id}):[];
 if(withdrawn.length!==withdrawIds.length)
  throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
 if(withdrawn.length){
  await tx.insert(placementApplicationStatusHistory).values(withdrawn.map(row=>({
   applicationId:row.id,fromStatus:"SUBMITTED" as const,toStatus:"WITHDRAWN" as const,
   actorUserId:input.actorUserId,reason:"placed elsewhere; cascade:"+cascadeId,cascadeId,
  })));
 }
 return {cascadeId,cascadedOfferCount:declined.length,withdrawnApplicationCount:withdrawn.length};
}
