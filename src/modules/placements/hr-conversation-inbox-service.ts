import "server-only";
import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoMessages} from "@/db/schema/tpo-collaboration";
import {conversationSnippet} from "./hr-conversation-snippet-model";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listMessageThreads} from "./tpo-messaging-service";
import {listOwnRecruiterPlacementJobs} from "./recruiter-service";
import {hrConversationQuerySchema,filterRecruiterConversations,HR_CONVERSATION_PAGE_SIZE,hrConversationPageBounds} from "./hr-conversation-inbox-model";
export async function listHrConversations(context:RequestContext,raw:unknown={}){
 const query=hrConversationQuerySchema.parse(raw);
 if(!hasActiveRecruiter(context)||!context.recruiter)throw new AuthorizationError("placements.recruiter.read");
 const grants=context.recruiter.grants;
 if(query.collegeId&&!grants.some(g=>g.collegeId===query.collegeId))
  throw new AuthorizationError("placements.recruiter.read");
 const unique=[...new Set(grants.map(g=>g.collegeId))];
 const collegeId=query.collegeId??(unique.length===1?unique[0]:null);
 if(!collegeId)return {status:unique.length?"CHOOSE_COLLEGE" as const:"NO_ACCESS" as const,
  choices:grants,items:[],collegeId:null};
 const [threads,jobs]=await Promise.all([
  listMessageThreads(context,collegeId),
  listOwnRecruiterPlacementJobs(context),
 ]);
 const allowed=jobs.filter(j=>j.collegeId===collegeId&&j.companyId===context.recruiter!.companyId);
 const knownJobIds=new Set(allowed.map(j=>j.job.id));
 const titles=new Map(allowed.map(j=>[j.job.id,j.job.title]));
 const filtered=filterRecruiterConversations(threads,knownJobIds,query.q,titles);
 const visible=filtered.slice(
  (query.page-1)*HR_CONVERSATION_PAGE_SIZE,query.page*HR_CONVERSATION_PAGE_SIZE,
 );
 const pagination=hrConversationPageBounds(query.page,filtered.length);
 const counts=visible.length?await getDb().select({
   threadId:placementTpoMessages.threadId,
   unread:sql<number>`count(*)::integer`,
  }).from(placementTpoMessages)
   .where(and(
    inArray(placementTpoMessages.threadId,visible.map(row=>row.id)),
    eq(placementTpoMessages.senderType,"TPO"),
    isNull(placementTpoMessages.readAt),
   )).groupBy(placementTpoMessages.threadId):[];
 const byThread=new Map(counts.map(row=>[row.threadId,Number(row.unread)]));
 const previews=visible.length?await getDb().selectDistinctOn(
  [placementTpoMessages.threadId],{
    threadId:placementTpoMessages.threadId,
    body:sql<string>`left(${placementTpoMessages.body},160)`,
    senderType:placementTpoMessages.senderType,
  }).from(placementTpoMessages)
   .where(inArray(placementTpoMessages.threadId,visible.map(row=>row.id)))
   .orderBy(placementTpoMessages.threadId,
    desc(placementTpoMessages.createdAt),desc(placementTpoMessages.id)):[];
 const byPreview=new Map(previews.map(row=>[row.threadId,{
  text:conversationSnippet(row.body),senderType:row.senderType,
 }]));
 return {status:"READY" as const,choices:grants,collegeId,
  items:visible.map(t=>({
   id:t.id,jobId:t.jobId,jobTitle:t.jobId?(titles.get(t.jobId)??"Authorized drive"):"General conversation",
   lastMessageAt:t.lastMessageAt,createdAt:t.createdAt,
   unread:byThread.get(t.id)??0,
   preview:byPreview.get(t.id)??null,
  })),pages:pagination.pages,page:query.page,total:filtered.length,
  first:pagination.first,last:pagination.last,
  unreadInView:visible.reduce((total,row)=>total+(byThread.get(row.id)??0),0)};
}
