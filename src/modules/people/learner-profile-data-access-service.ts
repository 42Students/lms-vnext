import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireOwnLearnerProfileAccess} from "./learner-profile-access-service";

/**
 * LEARNER-profile-misc-18: show recorded actions on the active learner's own
 * membership, not a fabricated "who viewed me" feed (reads are not audited).
 */
export async function getOwnLearnerProfileDataActions(context:RequestContext){
 const member=await requireOwnLearnerProfileAccess(context);
 return getDb().select({
   occurredAt:activityEvents.occurredAt,
   summary:activityEvents.summary,
   eventType:activityEvents.eventType,
  }).from(activityEvents).where(and(
   eq(activityEvents.organizationId,member.organizationId),
   eq(activityEvents.collegeId,member.collegeId),
   eq(activityEvents.subjectId,member.id),
  )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(20);
}
