import "server-only";
import {and,desc,eq,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema/activity";
import {getSuperAdminMembershipDetail} from "./admin-membership-detail-service";
import type {RequestContext} from "@/modules/identity/context";

/** A selected-college, read-only audit of an exact college membership.
 * Never infer actor records from a global user id in other colleges. */
export async function listSuperAdminPersonAudit(context:RequestContext,membershipId:string){
 if(!context.adminScope?.collegeId)return null;
 const membership=await getSuperAdminMembershipDetail(context,membershipId);
 if(!membership)return null;
 const events=await getDb().select({
  id:activityEvents.id,occurredAt:activityEvents.occurredAt,
  eventType:activityEvents.eventType,importance:activityEvents.importance,
  summary:activityEvents.summary,module:activityEvents.module,
  subjectType:activityEvents.subjectType,
 }).from(activityEvents)
 .where(and(eq(activityEvents.collegeId,context.adminScope.collegeId),
  or(eq(activityEvents.actorMembershipId,membershipId),
     and(eq(activityEvents.subjectId,membershipId),
      or(eq(activityEvents.subjectType,"membership"),eq(activityEvents.subjectType,"college_membership"))))))
 .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(100);
 return {membership,events};
}
