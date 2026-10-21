import "server-only";

import { and, count, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, collegeMemberships, inAppNotifications, membershipRoles, users } from "@/db/schema";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { listOwnNotificationPage } from "./notification-service";
import { resolveMentorInboxQuery } from "./mentor-notifications-model";

/**
 * Personal Mentor inbox: verify live role grants in migrated tables, not only
 * a caller-provided context role. Reuse the existing owner-only cursor reader.
 */
export async function requirePersistedMentorInboxMembership(context:RequestContext) {
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context, "MENTOR")) {
    throw new AuthorizationError("academics.read");
  }
  requirePermission(context, "academics.read", {
    organizationId: membership.organizationId,
    collegeId: membership.collegeId,
  });
  const [persisted] = await getDb().select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"MENTOR"),
    ))
    .where(and(
      eq(collegeMemberships.id,membership.id),
      eq(collegeMemberships.collegeId,membership.collegeId),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
    )).limit(1);
  if (!persisted) throw new AuthorizationError("academics.read");
  return membership;
}

/** Imported legacy mentor notification data is a historical projection only.
 * Actual writes must use an authorized activity event + owner-bound inbox
 * receipt, never an arbitrary legacy receiver ID or receiverType.
 */
export function projectLegacyMentorNotification(input:{
 created_at?:string|null;createdAt?:string|null;type:string;
 title:string;message:string;receiverType:string;
 /** Resolved by a trusted legacy recipient-ID -> UUID user crosswalk. */
 verifiedRecipientUserId?:string|null;legacyRecipientId?:string|number|null;
 readAt?:string|null;
},ownUserId:string){
 if(input.receiverType.toUpperCase()!=="MENTOR"||!ownUserId||
    !input.verifiedRecipientUserId||input.verifiedRecipientUserId!==ownUserId||
    input.legacyRecipientId==null)return null;
 const rawDate=input.created_at??input.createdAt;
 // Naive MySQL DATETIME is not an ISO instant. The import must supply a
 // verified source zone and normalize before reaching this projection.
 if(!rawDate||!/(?:Z|[+-]\\d{2}:\\d{2})$/.test(rawDate))return null;
 const occurredAt=new Date(rawDate);
 if(!occurredAt||!Number.isFinite(occurredAt.getTime()))return null;
 const readAt=input.readAt?new Date(input.readAt):null;
 if(readAt&&!Number.isFinite(readAt.getTime()))return null;
 return {event:{
  occurredAt,type:input.type.slice(0,100),
  title:input.title.slice(0,240),message:input.message.slice(0,2000),
  receiverType:"MENTOR" as const,
 },receipt:{userId:ownUserId,readAt}};
}
export async function getMentorPersonalInbox(context: RequestContext, rawQuery: unknown) {
  const {query,cursor}=resolveMentorInboxQuery(rawQuery);
  const membership=await requirePersistedMentorInboxMembership(context);
  const [page,unread] = await Promise.all([
    cursor.invalid
      ? Promise.resolve({items:[],nextCursor:null})
      : listOwnNotificationPage(context,{
        limit:50,unreadOnly:query.view==="unread",
        collegeId:membership.collegeId,
        ...(cursor.cursor ?? {}),
      }),
    getDb().select({total:count()}).from(inAppNotifications)
      .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
      .where(and(
        eq(inAppNotifications.userId,context.user.id),
        eq(activityEvents.collegeId,membership.collegeId),
        isNull(inAppNotifications.readAt),
      )),
  ]);
  return {query,cursor,page,unreadCount:Number(unread[0]?.total??0),
  pageSize:50,hasOlder:Boolean(page.nextCursor),
  olderCursor:page.nextCursor??null,
  olderLabel:"Older"};
}
