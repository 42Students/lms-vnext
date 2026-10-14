import "server-only";

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents } from "@/db/schema";
import { can } from "@/modules/permissions/policy";
import { hasActiveMembership,hasMembershipRole,type RequestContext } from "@/modules/identity/context";
import { getFacultyDeliveryRoster } from "@/modules/attendance/faculty-service";
import { CoursesServiceError } from "./errors";
import {
  discussionHistoryPagination, facultyDiscussionHistorySchema,
  discussionHistoryLabel,
} from "./faculty-discussion-history-model";

/** Source-of-truth actor-scoped audit, filtered by exact persisted delivery group. */
export async function getFacultyDiscussionHistory(context:RequestContext,raw:unknown) {
  const query=facultyDiscussionHistorySchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
    !can(context,"courses.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    })) throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const {delivery}=await getFacultyDeliveryRoster(context,query.deliveryId);
  const kinds=query.action==="PIN"?["courses.discussion.pin_changed"]:
    query.action==="DELETE"?["courses.discussion.deleted"]:
    query.action==="REPLY"?["courses.discussion.replied"]:
    ["courses.discussion.pin_changed","courses.discussion.deleted",
      "courses.discussion.replied"];
  const filter=and(
    eq(activityEvents.collegeId,membership.collegeId),
    eq(activityEvents.organizationId,membership.organizationId),
    eq(activityEvents.module,"COURSES"),
    eq(activityEvents.groupKey,"course-discussion:"+query.deliveryId),
    inArray(activityEvents.eventType,kinds),
  );
  const db=getDb();
  const [totals]=await db.select({total:count()}).from(activityEvents).where(filter);
  const pagination=discussionHistoryPagination(Number(totals?.total??0),query.page);
  const results=await db.select({
    id:activityEvents.id,subjectId:activityEvents.subjectId,
    eventType:activityEvents.eventType,occurredAt:activityEvents.occurredAt,
    actorMembershipId:activityEvents.actorMembershipId,
    metadata:activityEvents.metadata,
  }).from(activityEvents).where(filter)
    .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id))
    .limit(pagination.pageSize).offset((pagination.page-1)*pagination.pageSize);
  return {
    delivery,query,...pagination,
    items:results.map(({metadata,...item})=>({
      ...item,action:discussionHistoryLabel(item.eventType,metadata?.pinned),
    })),
  };
}
