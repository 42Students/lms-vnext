import "server-only";
import { and,eq,isNotNull,isNull,sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
 activityEvents,colleges,collegeMemberships,membershipRoles,placementBatchLifecycles,
 placementBatchRegistrations,placementPublicPageSettings,users,
} from "@/db/schema";
import { hasMembershipRole,type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { publicPlacementTableReady } from "./readiness";
import { publicPlacementPublicationInput,publicPublicationDecision,
 publicPublicationTimestamp } from "./publication-policy";

export class PublicPlacementPublishError extends Error {
 constructor(readonly code:"NOT_CONFIGURED"|"SMALL_COHORT"|"NOT_REGISTERED"){
  super(code);this.name="PublicPlacementPublishError";
 }
}
async function scope(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
    !hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 return {member,college:await requirePlacementManageScope(context,member.collegeId)};
}
/** Live count of distinct active, consented learners in invited unfinished batches. */
export async function registeredPublicPlacementCohort(
 db:Pick<ReturnType<typeof getDb>,"select">,collegeId:string,
):Promise<number>{
 const [row]=await db.select({
  total:sql<number>`count(distinct ${placementBatchRegistrations.membershipId})::integer`,
 }).from(placementBatchRegistrations)
  .innerJoin(placementBatchLifecycles,and(
   eq(placementBatchLifecycles.cohortId,placementBatchRegistrations.cohortId),
   eq(placementBatchLifecycles.collegeId,placementBatchRegistrations.collegeId)))
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,placementBatchRegistrations.membershipId),
   eq(collegeMemberships.collegeId,placementBatchRegistrations.collegeId)))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(placementBatchRegistrations.collegeId,collegeId),
   eq(placementBatchRegistrations.choice,"PLACEMENTS"),
   isNotNull(placementBatchRegistrations.consentAt),
   isNotNull(placementBatchLifecycles.invitedAt),
   isNull(placementBatchLifecycles.finishedAt),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")));
 return row?.total??0;
}
/** Create-on-first-toggle, with fresh registered cohort evidence and actor audit. */
export async function setTpoPublicPlacementPublication(
 context:RequestContext,raw:unknown,
):Promise<{enabled:boolean;populationCount:number}>{
 const input=publicPlacementPublicationInput.parse(raw);
 const {member,college}=await scope(context);
 if(!await publicPlacementTableReady())throw new PublicPlacementPublishError("NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [locked]=await tx.select({id:colleges.id}).from(colleges)
   .where(and(eq(colleges.id,college.id),eq(colleges.status,"ACTIVE")))
   .for("update").limit(1);
  if(!locked)throw new PublicPlacementPublishError("NOT_CONFIGURED");
  const population=await registeredPublicPlacementCohort(tx,college.id);
  const [existing]=await tx.select({
   enabled:placementPublicPageSettings.enabled,
   populationCount:placementPublicPageSettings.populationCount,
   publishedAt:placementPublicPageSettings.publishedAt,
  }).from(placementPublicPageSettings)
   .where(eq(placementPublicPageSettings.collegeId,college.id)).for("update").limit(1);
  const decision=publicPublicationDecision(input,{
   populationCount:population,publishedAt:existing?.publishedAt??null,
  });
  if(decision==="SMALL_COHORT")throw new PublicPlacementPublishError("SMALL_COHORT");
  if(existing?.enabled===input.enabled &&
     existing.populationCount===population &&
     (!input.enabled||existing.publishedAt!==null))
   return {enabled:input.enabled,populationCount:population};
  const now=new Date();
  await tx.insert(placementPublicPageSettings).values({
   collegeId:college.id,enabled:input.enabled,populationCount:population,
   publishedAt:publicPublicationTimestamp(input.enabled,now),updatedAt:now,
  }).onConflictDoUpdate({
   target:placementPublicPageSettings.collegeId,
   set:{enabled:input.enabled,populationCount:population,
    publishedAt:publicPublicationTimestamp(input.enabled,now),updatedAt:now},
  });
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:member.id,
   module:"PLACEMENTS",eventType:"placements.public_stats.publication_changed",
   subjectType:"placement_public_page_settings",subjectId:college.id,
   summary:input.enabled?"Public placement statistics enabled":"Public placement statistics disabled",
   metadata:{enabled:input.enabled,populationCount:population},
  });
  return {enabled:input.enabled,populationCount:population};
 });
}
export async function getTpoPublicPlacementPublication(context:RequestContext){
 const {college}=await scope(context);
 if(!await publicPlacementTableReady())return {ready:false as const};
 const [settings,populationCount]=await Promise.all([
  getDb().select({
   enabled:placementPublicPageSettings.enabled,
   populationCount:placementPublicPageSettings.populationCount,
   publishedAt:placementPublicPageSettings.publishedAt,
  }).from(placementPublicPageSettings).where(eq(placementPublicPageSettings.collegeId,college.id)).limit(1),
  registeredPublicPlacementCohort(getDb(),college.id),
 ]);
 // Publication is not inferred from an old snapshot alone: an explicit
 // published opt-in and the CURRENT consented college population are required.
 // Individual public metric values must additionally be calculated over the
 // preceding 12 months in the public read service, never from this snapshot.
 const active=settings[0];
 const publicEligible=Boolean(active?.enabled&&active.publishedAt&&populationCount>=5);
 return {ready:true as const,settings:active??null,populationCount,publicEligible};
}
