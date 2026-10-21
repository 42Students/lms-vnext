import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementJobs,placementOffers} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {getLatestPlacementOfferForApplication,listPlacementJobOffers} from "./offer-service";
import {enrichTpoOfferFacts} from "./tpo-offer-academic-enrichment";
import {requirePlacementManageScope} from "./scope";
import {offerRegisterQuery,projectOfferRegister,tpoDriveOfferRegisterCsv} from "./tpo-drive-offer-register-model";
export async function getTpoDriveOfferRegister(context:RequestContext,raw:unknown){
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO")||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.manage");
 const collegeId=member.collegeId;
 if(!can(context,"placements.manage",{collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId});
 const input=offerRegisterQuery.parse(raw);
 const [job]=await getDb().select({id:placementJobs.id,title:placementJobs.title}).from(placementJobs)
  .where(and(eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 await requirePlacementManageScope(context,collegeId);
 const facts=await listPlacementJobOffers(context,job.id);
 const enriched=await enrichTpoOfferFacts(facts,collegeId);
 return {job,status:input.status,...projectOfferRegister(enriched,input.status,input.page,input.q,input.joining,new Date(),input.kind,input.expiry,input.minCtcLpa,input.maxCtcLpa)};
}

/** Read-only, scoped export. Does not mark a letter delivered or contact a learner. */
export async function getTpoDriveOfferRegisterCsv(context:RequestContext,raw:unknown){
 const input=offerRegisterQuery.omit({page:true}).parse(raw);
 const scoped=await getTpoDriveOfferRegister(context,{...input,page:1});
 const facts=await listPlacementJobOffers(context,scoped.job.id);
 const enriched=await enrichTpoOfferFacts(facts,context.membership!.collegeId);
 return tpoDriveOfferRegisterCsv(enriched,input);
}

/** Job and learner read projections use the same active TPO membership
 * boundary, never an unscoped UUID. Preserve each historical offer row. */
export async function listTpoLearnerOffers(
 context:RequestContext,rawMembershipId:unknown,
){
 const membershipId=z.uuid().parse(rawMembershipId);
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
    !hasMembershipRole(context,"TPO"))
  throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId:member.collegeId});
 await requirePlacementManageScope(context,member.collegeId);
 const [learner]=await getDb().select({id:collegeMemberships.id})
  .from(collegeMemberships).where(and(
   eq(collegeMemberships.id,membershipId),
   eq(collegeMemberships.collegeId,member.collegeId),
   eq(collegeMemberships.status,"ACTIVE"))).limit(1);
 if(!learner)throw new PlacementsServiceError("PLACEMENT_APPLICATION_NOT_FOUND");
 const found=await getDb().select({
  offer:placementOffers,applicationId:placementApplications.id,
  jobId:placementJobs.id,jobTitle:placementJobs.title,
 }).from(placementOffers)
  .innerJoin(placementApplications,eq(placementApplications.id,placementOffers.applicationId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .where(and(eq(placementApplications.membershipId,membershipId),
    eq(placementJobs.collegeId,member.collegeId)))
  .orderBy(desc(placementOffers.issuedAt),desc(placementOffers.id));
 return found.map(row=>({...row,
  // An accepted offer alone is not evidence of the campus held-offer rules.
  holdingRuleStatus:"REQUIRES_COLLEGE_POLICY_RECONCILIATION" as const,
 }));
}

/** Repository latest-by-application semantics, behind the same scoped role
 * gate. The offer service re-verifies the application/job college. */
export async function getTpoLatestOfferForApplication(
 context:RequestContext,rawApplicationId:unknown,
){
 const applicationId=z.uuid().parse(rawApplicationId);
 if(!context.membership||!hasMembershipRole(context,"TPO")||
    context.membership.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId:context.membership.collegeId});
 await requirePlacementManageScope(context,context.membership.collegeId);
 return getLatestPlacementOfferForApplication(context,applicationId);
}

/** Compound repository scope for the old by-job-and-learner lookup. */
export async function listTpoJobLearnerOffers(
 context:RequestContext,rawJobId:unknown,rawMembershipId:unknown,
){
 const jobId=z.uuid().parse(rawJobId);
 const rows=await listTpoLearnerOffers(context,rawMembershipId);
 return rows.filter(row=>row.jobId===jobId);
}
