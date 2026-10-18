import "server-only";
import {and,desc,eq,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {activityEvents} from "@/db/schema/activity";
import {getSuperAdminMembershipDetail} from "./admin-membership-detail-service";
import type {RequestContext} from "@/modules/identity/context";

/** A selected-college, read-only audit of an exact college membership.
 * Never infer actor records from a global user id in other colleges. */
export async function listSuperAdminPersonAudit(context:RequestContext,membershipId:string){
 const scope=context.adminScope;
 if(!scope?.collegeId)return null;
 const membership=await getSuperAdminMembershipDetail(context,membershipId);
 if(!membership)return null;
 // The membership preflight is outside this read. A role/tenant scope may
 // be revoked between it and event projection: hold persisted actor locks
 // until the scoped audit query has completed.
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"people.manage",{
   collegeId:scope.collegeId,organizationId:scope.organizationId,
  });
  const events=await tx.select({
  id:activityEvents.id,occurredAt:activityEvents.occurredAt,
  eventType:activityEvents.eventType,importance:activityEvents.importance,
  summary:activityEvents.summary,module:activityEvents.module,
  subjectType:activityEvents.subjectType,
 }).from(activityEvents)
 .where(and(eq(activityEvents.collegeId,scope.collegeId),
  or(eq(activityEvents.actorMembershipId,membershipId),
     and(eq(activityEvents.subjectId,membershipId),
      or(eq(activityEvents.subjectType,"membership"),eq(activityEvents.subjectType,"college_membership"))))))
 .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(100);
  return {membership,events};
 });
}
