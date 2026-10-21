import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,placementCandidatePreferences,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {candidatePreferencesInputSchema} from "./validation";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

const allowed=new Set([
 "preferredRoleTitles","preferredLocations","preferredEmploymentTypes",
 "preferredWorkMode","shiftPreference","minimumAnnualCtcInr",
 "relocationPreference","notifyMatchingJobs","notifyApplicationUpdates",
]);
const patchSchema=z.strictObject({
 expectedUpdatedAt:z.iso.datetime({offset:true}).nullable(),
 changes:z.record(z.string(),z.unknown()),
});
/** PATCH only explicit fields. Caller must supply the exact timestamp from
 * its last GET (or null if never saved). This does not modify the legacy
 * profile document or its independent staff-only PAP/exam-slot properties.
 */
export async function patchCandidatePreferences(context:RequestContext,raw:unknown){
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"LEARNER"))
  throw new AuthorizationError("placements.read");
 await requireLearnerPlacementAccess(context);
 const input=patchSchema.parse(raw);
 const keys=Object.keys(input.changes);
 if(!keys.length||keys.some(key=>!allowed.has(key)))
  throw new PlacementsServiceError("PLACEMENT_PREFERENCES_INVALID_PATCH");
 return getDb().transaction(async tx=>{
  // The membership lock serializes even the first insert (no preferences
  // row exists yet), and protects against concurrent role revocation.
  const [member]=await tx.select({userId:collegeMemberships.userId,
   status:collegeMemberships.status,collegeId:collegeMemberships.collegeId})
   .from(collegeMemberships).where(eq(collegeMemberships.id,membership.id))
   .for("update").limit(1);
  const [account]=await tx.select({status:users.platformStatus}).from(users)
   .where(eq(users.id,context.user.id)).for("share").limit(1);
  const [role]=await tx.select({id:membershipRoles.id}).from(membershipRoles)
   .where(and(eq(membershipRoles.membershipId,membership.id),
    eq(membershipRoles.role,"LEARNER"))).for("share").limit(1);
  if(!member||member.userId!==context.user.id||
    member.collegeId!==membership.collegeId||member.status!=="ACTIVE"||
    account?.status!=="ACTIVE"||!role)
   throw new AuthorizationError("placements.read");
  const [before]=await tx.select().from(placementCandidatePreferences)
   .where(eq(placementCandidatePreferences.membershipId,membership.id))
   .for("update").limit(1);
  const actual=before?.updatedAt.toISOString()??null;
  const expected=input.expectedUpdatedAt===null?null:
   new Date(input.expectedUpdatedAt).toISOString();
  if(actual!==expected)
   throw new PlacementsServiceError("PLACEMENT_PREFERENCES_STALE");
  const defaults=candidatePreferencesInputSchema.parse({});
  const base=before?{
   preferredRoleTitles:before.preferredRoleTitles,
   preferredLocations:before.preferredLocations,
   preferredEmploymentTypes:before.preferredEmploymentTypes,
   preferredWorkMode:before.preferredWorkMode,
   shiftPreference:before.shiftPreference,
   minimumAnnualCtcInr:before.minimumAnnualCtcInr,
   relocationPreference:before.relocationPreference,
   notifyMatchingJobs:before.notifyMatchingJobs,
   notifyApplicationUpdates:before.notifyApplicationUpdates,
  }:defaults;
  const merged=candidatePreferencesInputSchema.parse({...base,...input.changes});
  const [saved]=before?
   await tx.update(placementCandidatePreferences).set({
    ...merged,updatedAt:new Date(),
   }).where(eq(placementCandidatePreferences.membershipId,membership.id)).returning():
   await tx.insert(placementCandidatePreferences).values({
    membershipId:membership.id,...merged,
   }).returning();
  if(!saved)throw new PlacementsServiceError("PLACEMENT_PREFERENCES_STALE");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_CANDIDATE_PREFERENCES_UPDATED,
   collegeId:membership.collegeId,organizationId:membership.organizationId,
   subjectType:"placement_candidate_preferences",subjectId:membership.id,
   summary:"Learner updated placement preference fields",
   metadata:{changedFields:keys},
  });
  return saved;
 });
}
