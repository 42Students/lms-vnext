import "server-only";
import {and,desc,eq,isNull,like,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoMessageThreads,placementTpoMessages} from "@/db/schema/tpo-collaboration";
import type {RequestContext} from "@/modules/identity/context";
import {listHrConversations} from "./hr-conversation-inbox-service";
import {readRecruiterThreadMessages} from "./tpo-messaging-service";
import {hrDriveProposalHistoryQuerySchema,hrProposalHistoryWindow,HR_PROPOSAL_PAGE_SIZE,previewHrDriveProposalMessage} from "./hr-drive-proposal-history-model";

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
  return {status:inbox.status,collegeId:null,choices:inbox.choices,items:[],total:0,page:1,pages:1,limited:false};
 const [thread]=await getDb().select({id:placementTpoMessageThreads.id})
  .from(placementTpoMessageThreads).where(and(
   eq(placementTpoMessageThreads.collegeId,inbox.collegeId),
   eq(placementTpoMessageThreads.recruiterUserId,context.user.id),
   isNull(placementTpoMessageThreads.jobId),
  )).limit(1);
 if(!thread)
  return {status:"READY" as const,collegeId:inbox.collegeId,choices:inbox.choices,
   items:[],limited:false};
 // Recheck persisted ownership and grant with the canonical message reader.
 await readRecruiterThreadMessages(context,thread.id,1);
 const where=and(
  eq(placementTpoMessages.threadId,thread.id),
  eq(placementTpoMessages.senderType,"RECRUITER"),
  eq(placementTpoMessages.senderUserId,context.user.id),
  like(placementTpoMessages.body,"Drive proposal for placement cell discussion — NOT a submitted approval request%"),
 );
 const [count]=await getDb().select({total:sql<number>`count(*)::integer`})
  .from(placementTpoMessages).where(where);
 const total=Number(count?.total??0);
 const window=hrProposalHistoryWindow(query.page,total);
 const messages=await getDb().select({
  id:placementTpoMessages.id,
  body:placementTpoMessages.body,
  createdAt:placementTpoMessages.createdAt,
 }).from(placementTpoMessages).where(where)
  .orderBy(desc(placementTpoMessages.createdAt),desc(placementTpoMessages.id))
  .limit(HR_PROPOSAL_PAGE_SIZE).offset(window.offset);
 const items=messages.flatMap(message=>{
  const preview=previewHrDriveProposalMessage(message.body);
  return preview?[{...preview,id:message.id,threadId:thread.id,createdAt:message.createdAt}]:[];
 });
 return {status:"READY" as const,collegeId:inbox.collegeId,choices:inbox.choices,
  items,total,page:window.page,pages:window.pages,limited:window.pages>1};
}
