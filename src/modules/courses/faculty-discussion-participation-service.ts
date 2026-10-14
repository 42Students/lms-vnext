import "server-only";
import {desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseDiscussionMessages} from "@/db/schema";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can,AuthorizationError} from "@/modules/permissions/policy";
import {getFacultyDeliveryRoster} from "@/modules/attendance/faculty-service";
import {facultyDiscussionParticipationSchema,facultyDiscussionParticipationSummary}
  from "./faculty-discussion-participation-model";

/** Registered messages only; reply relationships cannot be counted without a reply FK. */
export async function getFacultyDiscussionParticipation(context:RequestContext,raw:unknown){
  const {deliveryId}=facultyDiscussionParticipationSchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
    !can(context,"courses.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new AuthorizationError("courses.read");
  const {delivery}=await getFacultyDeliveryRoster(context,deliveryId);
  const db=getDb();
  const [[counts],recent]=await Promise.all([
    db.select({
      total:sql<number>`count(*)::int`,
      faculty:sql<number>`count(*) filter (where ${courseDiscussionMessages.senderRole} = 'FACULTY')::int`,
      learner:sql<number>`count(*) filter (where ${courseDiscussionMessages.senderRole} = 'LEARNER')::int`,
      pinned:sql<number>`count(*) filter (where ${courseDiscussionMessages.pinned})::int`,
    }).from(courseDiscussionMessages).where(eq(courseDiscussionMessages.deliveryId,deliveryId)),
    db.select({id:courseDiscussionMessages.id,senderRole:courseDiscussionMessages.senderRole,
      pinned:courseDiscussionMessages.pinned,createdAt:courseDiscussionMessages.createdAt})
      .from(courseDiscussionMessages)
      .where(eq(courseDiscussionMessages.deliveryId,deliveryId))
      .orderBy(desc(courseDiscussionMessages.createdAt),desc(courseDiscussionMessages.id)).limit(12),
  ]);
  return {delivery,counts:facultyDiscussionParticipationSummary(counts??{
    total:0,faculty:0,learner:0,pinned:0,
  }),recent:recent.map(row=>({...row,createdAt:row.createdAt.toISOString()}))};
}
