import "server-only";
import {and,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoMessages,placementTpoMessageThreads} from "@/db/schema";
import {type RequestContext} from "@/modules/identity/context";
import {requirePersistedTpoInboxReader} from "./tpo-messages-service";
import {placementTableExists} from "./staged-tables";

/** TPO-inbox-team-03: college-scoped, read-only unread recruiter message count.
 * No message bodies or external PII are loaded into the topbar.
 */
export async function countTpoUnreadRecruiterMessages(context:RequestContext){
 const collegeId=await requirePersistedTpoInboxReader(context);
 const [threadsReady,messagesReady]=await Promise.all([
  placementTableExists("placement_tpo_message_threads"),
  placementTableExists("placement_tpo_messages"),
 ]);
 if(!threadsReady||!messagesReady)return 0; // Existing inbox identifies unavailable source explicitly.
 const [row]=await getDb().select({
  total:sql<number>`count(${placementTpoMessages.id})::integer`,
 }).from(placementTpoMessages)
  .innerJoin(placementTpoMessageThreads,eq(
   placementTpoMessageThreads.id,placementTpoMessages.threadId))
  .where(and(eq(placementTpoMessageThreads.collegeId,collegeId),
   eq(placementTpoMessages.senderType,"RECRUITER"),
   isNull(placementTpoMessages.readAt)));
 return row?.total??0;
}
