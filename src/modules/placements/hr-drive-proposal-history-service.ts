import "server-only";
import {and,desc,eq,like} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoMessages} from "@/db/schema/tpo-collaboration";
import type {RequestContext} from "@/modules/identity/context";
import {listHrConversations} from "./hr-conversation-inbox-service";
import {readRecruiterThreadMessages} from "./tpo-messaging-service";
import {hrDriveProposalHistoryQuerySchema,previewHrDriveProposalMessage} from "./hr-drive-proposal-history-model";

/**
 * Read-only preview of up to 50 persisted employer proposal messages.
 * Uses the same recruiter grant + exact thread ownership path as the inbox.
 */
export async function listHrDriveProposals(context:RequestContext,raw:unknown={}){
 const query=hrDriveProposalHistoryQuerySchema.parse(raw);
 const inbox=await listHrConversations(context,{
  collegeId:query.collegeId,scope:"GENERAL",page:1,
 });
 if(inbox.status!=="READY")
  return {status:inbox.status,collegeId:null,choices:inbox.choices,items:[],limited:false};
 const thread=inbox.items.find(item=>item.jobId===null);
 if(!thread)
  return {status:"READY" as const,collegeId:inbox.collegeId,choices:inbox.choices,
   items:[],limited:false};
 // Recheck persisted ownership and grant with the canonical message reader.
 await readRecruiterThreadMessages(context,thread.id,1);
 const messages=await getDb().select({
  id:placementTpoMessages.id,
  body:placementTpoMessages.body,
  createdAt:placementTpoMessages.createdAt,
 }).from(placementTpoMessages).where(and(
  eq(placementTpoMessages.threadId,thread.id),
  eq(placementTpoMessages.senderType,"RECRUITER"),
  eq(placementTpoMessages.senderUserId,context.user.id),
  like(placementTpoMessages.body,"Drive proposal for placement cell discussion — NOT a submitted approval request%"),
 )).orderBy(desc(placementTpoMessages.createdAt),desc(placementTpoMessages.id)).limit(51);
 const items=messages.slice(0,50).flatMap(message=>{
  const preview=previewHrDriveProposalMessage(message.body);
  return preview?[{...preview,id:message.id,threadId:thread.id,createdAt:message.createdAt}]:[];
 });
 return {status:"READY" as const,collegeId:inbox.collegeId,choices:inbox.choices,
  items,limited:messages.length>50};
}
