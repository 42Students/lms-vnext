import "server-only";
import { and,desc,eq,sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementTpoMessages,placementTpoMessageThreads,users } from "@/db/schema";
import { hasMembershipRole,type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listMessageThreads } from "./tpo-messaging-service";

/** Legacy author, channel and request-event fields are persisted in vNext.
 * Read them from the scoped thread instead of inventing empty values. */
export type TpoRecruiterMessageItem={
 id:string;senderType:string;senderId:string;senderName:string|null;
 body:string;createdAt:Date;readAt:Date|null;
 via:string;kind:string;event:string|null;changeRequestId:string|null;
};
export async function getTpoRecruiterThreadDetail(context:RequestContext,rawId:unknown){
 const id=z.string().uuid().parse(rawId),member=context.membership;
 if(!member||member.status!=="ACTIVE"||!hasMembershipRole(context,"TPO"))
   throw new AuthorizationError("placements.manage");
 // The existing service verifies the caller's college and permission before
 // listing thread IDs; an arbitrary URL cannot select a foreign college thread.
 const own=await listMessageThreads(context,member.collegeId);
 const thread=own.find(row=>row.id===id);
 if(!thread)return null;
 const [count]=await getDb().select({total:sql<number>`count(*)::integer`})
  .from(placementTpoMessages).where(eq(placementTpoMessages.threadId,thread.id));
 const newest=await getDb().select({
  id:placementTpoMessages.id,senderType:placementTpoMessages.senderType,
  senderId:placementTpoMessages.senderUserId,senderName:users.displayName,
  via:placementTpoMessages.via,kind:placementTpoMessages.kind,
  event:placementTpoMessages.event,changeRequestId:placementTpoMessages.changeRequestId,
  body:placementTpoMessages.body,createdAt:placementTpoMessages.createdAt,
  readAt:placementTpoMessages.readAt,
 }).from(placementTpoMessages).innerJoin(placementTpoMessageThreads,
   eq(placementTpoMessageThreads.id,placementTpoMessages.threadId))
  .leftJoin(users,eq(users.id,placementTpoMessages.senderUserId))
  .where(and(eq(placementTpoMessages.threadId,thread.id),
   eq(placementTpoMessageThreads.collegeId,member.collegeId)))
  .orderBy(desc(placementTpoMessages.createdAt),desc(placementTpoMessages.id))
  .limit(100);
 const messages:TpoRecruiterMessageItem[]=newest.reverse();
 return {thread,messages,total:count?.total??0};
}
