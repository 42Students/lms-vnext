import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,inAppNotifications,
 membershipRoles,placementTpoMessages,users} from "@/db/schema";
import {recruiterMessageTpoRecipients,recruiterMessageTpoHref,recruiterMessageTpoPreview,
 RECRUITER_MESSAGE_TPO_TITLE} from "./recruiter-message-tpo-notification-model";

type Db=ReturnType<typeof getDb>;
type Tx=Parameters<Parameters<Db["transaction"]>[0]>[0];
/** Registered in-app bell side effect in the SAME transaction as the recruiter
 * message. Recipient authorization comes from persisted active TPO memberships,
 * never the request body or stale session claims. Does not send email. */
export async function notifyTpoOfRecruiterMessage(tx:Tx,input:{
 collegeId:string;threadId:string;messageId:string;senderUserId:string;at:Date;
}) {
 const [college]=await tx.select({organizationId:colleges.organizationId})
  .from(colleges).where(and(eq(colleges.id,input.collegeId),eq(colleges.status,"ACTIVE"))).limit(1);
 if(!college)throw new Error("RECRUITER_MESSAGE_COLLEGE_INACTIVE");
 const members=await tx.select({userId:collegeMemberships.userId})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"TPO")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.collegeId,input.collegeId),
    eq(collegeMemberships.status,"ACTIVE")));
 const recipients=recruiterMessageTpoRecipients(members,input.senderUserId);
 if(recipients.length===0)return {notified:0};
 const [sourceMessage]=await tx.select({body:placementTpoMessages.body})
  .from(placementTpoMessages).where(and(
    eq(placementTpoMessages.id,input.messageId),
    eq(placementTpoMessages.threadId,input.threadId),
  )).limit(1);
 if(!sourceMessage)throw new Error("RECRUITER_MESSAGE_NOTIFICATION_SOURCE_MISSING");
 const preview=recruiterMessageTpoPreview(sourceMessage.body);
 const [event]=await tx.insert(activityEvents).values({
  organizationId:college.organizationId,collegeId:input.collegeId,
  actorUserId:input.senderUserId,module:"PLACEMENTS",
  eventType:"placements.recruiter.message.received",
  subjectType:"placement_tpo_message_thread",subjectId:input.threadId,
  summary:RECRUITER_MESSAGE_TPO_TITLE,occurredAt:input.at,
  metadata:{messageId:input.messageId,threadId:input.threadId},
 }).returning({id:activityEvents.id});
 if(!event)throw new Error("RECRUITER_MESSAGE_BELL_EVENT_FAILED");
 await tx.insert(inAppNotifications).values(recipients.map(userId=>({
  userId,eventId:event.id,title:RECRUITER_MESSAGE_TPO_TITLE,
  body:preview,
  actionHref:recruiterMessageTpoHref(input.threadId),createdAt:input.at,
 })));
 return {notified:recipients.length};
}
