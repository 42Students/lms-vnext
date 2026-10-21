import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getDriveChangeRequests,mutateDriveChangeRequest} from "@/modules/placements/tpo-drive-change-request-service";
import {z} from "zod";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs} from "@/db/schema";
import {placementTpoInternalThreads,placementTpoInternalThreadParticipants} from "@/db/schema/tpo-internal";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {AuthorizationError} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {readTpoInternalConversation} from "@/modules/placements/tpo-team-conversation-service";
import {postTpoInternalMessage} from "@/modules/placements/tpo-team-internal-reply-service";

const internalNoteSchema=z.strictObject({
 kind:z.literal("INTERNAL_NOTE"),threadId:z.string().uuid(),
 body:z.string().trim().min(1).max(4000),
 idempotencyKey:z.string().uuid().optional(),
});
/** VNext's DRIVE Team conversations replace old /internal-notes.
 * This compatibility view never treats recruiter change-request notes as
 * internal staff messages. It accesses only threads associated with THIS
 * persisted drive and the caller's current active TPO membership. */
async function scopedDriveThreads(context:Awaited<ReturnType<typeof getCurrentRequestContext>>,
 rawJobId:string){
 if(!context.membership||!hasPlacementTeamMembership(context))
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,context.membership.collegeId);
 const jobId=z.string().uuid().parse(rawJobId);
 const [job]=await getDb().select({id:placementJobs.id})
  .from(placementJobs).where(and(eq(placementJobs.id,jobId),
    eq(placementJobs.collegeId,college.id))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 if(!await placementTableExists("placement_tpo_internal_threads")||
  !await placementTableExists("placement_tpo_internal_thread_participants"))
  return {status:"NOT_REGISTERED" as const,threads:[]};
 const threads=await getDb().select({
  id:placementTpoInternalThreads.id,topic:placementTpoInternalThreads.topic,
 }).from(placementTpoInternalThreads)
  .innerJoin(placementTpoInternalThreadParticipants,and(
   eq(placementTpoInternalThreadParticipants.threadId,placementTpoInternalThreads.id),
   eq(placementTpoInternalThreadParticipants.collegeId,placementTpoInternalThreads.collegeId),
   eq(placementTpoInternalThreadParticipants.membershipId,context.membership.id),
   isNull(placementTpoInternalThreadParticipants.leftAt),
  ))
  .where(and(eq(placementTpoInternalThreads.collegeId,college.id),
   eq(placementTpoInternalThreads.kind,"DRIVE"),
   eq(placementTpoInternalThreads.contextId,jobId)))
  .orderBy(placementTpoInternalThreads.createdAt)
  .limit(100);
 return {status:"READY" as const,threads};
}

export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{jobId:string}>};
export async function GET(req:Request,{params}:Props){
 try{const {jobId}=await params;
  const context=await getCurrentRequestContext();
  const url=new URL(req.url);
  if(url.searchParams.get("view")==="internal-notes"){
   const scoped=await scopedDriveThreads(context,jobId);
   const threadId=url.searchParams.get("threadId");
   if(!threadId)return NextResponse.json(scoped,{
    headers:{"Cache-Control":"private, no-store"}});
   if(!scoped.threads.some(thread=>thread.id===threadId))
    return NextResponse.json({error:"TEAM_THREAD_NOT_FOUND"},{status:404});
   const data=await readTpoInternalConversation(context,threadId,
    Number(url.searchParams.get("page")||"1"));
   if(data.status!=="READY")
    return NextResponse.json({error:data.status},{status:data.status==="NOT_REGISTERED"?503:404});
   return NextResponse.json({...data,messages:data.messages.filter(row=>!row.removed)},{
    headers:{"Cache-Control":"private, no-store"}});
  }
  return NextResponse.json(await getDriveChangeRequests(context,jobId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(req:Request,{params}:Props){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  const context=await getCurrentRequestContext();
  const body:unknown=await req.json().catch(()=>null);
  if(body&&typeof body==="object"&&!Array.isArray(body)&&
    (body as {kind?:unknown}).kind==="INTERNAL_NOTE"){
   const input=internalNoteSchema.parse(body);
   const scoped=await scopedDriveThreads(context,jobId);
   if(scoped.status!=="READY")
    return NextResponse.json({error:"TEAM_TABLES_PENDING"},{status:503});
   if(!scoped.threads.some(thread=>thread.id===input.threadId))
    return NextResponse.json({error:"TEAM_THREAD_NOT_FOUND"},{status:404});
   const created=await postTpoInternalMessage(context,{
    threadId:input.threadId,body:input.body,
    idempotencyKey:input.idempotencyKey,markDecision:false,
   });
   return NextResponse.json({kind:"INTERNAL_NOTE",threadId:created.threadId,
    messageId:created.id,notified:created.notified},
    {status:201,headers:{"Cache-Control":"private, no-store"}});
  }
  return NextResponse.json(await mutateDriveChangeRequest(context,jobId,body),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
