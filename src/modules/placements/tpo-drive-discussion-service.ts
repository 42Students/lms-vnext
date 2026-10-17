import "server-only";
import {and,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs,users} from "@/db/schema";
import {placementTpoMessageThreads,placementTpoMessages} from "@/db/schema/tpo-collaboration";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

/** Drive-specific recruiter conversations. Never expose threads belonging to
 * another college, nor infer that a message was delivered externally. */
export async function getTpoDriveDiscussion(context:RequestContext,jobId:string){
 const membership=context.membership;
 if(!membership||membership.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
  !hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const collegeId=membership.collegeId;
 await requirePlacementManageScope(context,collegeId);
 const [job]=await getDb().select({id:placementJobs.id,title:placementJobs.title})
  .from(placementJobs).where(and(eq(placementJobs.id,jobId),
   eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [threadsReady,messagesReady]=await Promise.all([
  placementTableExists("placement_tpo_message_threads"),
  placementTableExists("placement_tpo_messages"),
 ]);
 if(!threadsReady||!messagesReady)return {job,available:false,threads:[]};
 const threads=await getDb().select({
  id:placementTpoMessageThreads.id,recruiterName:users.displayName,
  lastPreview:sql<string|null>`(select left(m.body,160) from placement_tpo_messages m
   where m.thread_id=${placementTpoMessageThreads.id}
   order by m.created_at desc,m.id desc limit 1)`,
  latestAt:sql<Date|null>`max(${placementTpoMessages.createdAt})`,
  unread:sql<number>`count(${placementTpoMessages.id}) filter
   (where ${placementTpoMessages.senderType}='RECRUITER'
     and ${placementTpoMessages.readAt} is null)::integer`,
  count:sql<number>`count(${placementTpoMessages.id})::integer`,
 }).from(placementTpoMessageThreads)
 .innerJoin(users,eq(users.id,placementTpoMessageThreads.recruiterUserId))
 .leftJoin(placementTpoMessages,eq(placementTpoMessages.threadId,placementTpoMessageThreads.id))
 .where(and(eq(placementTpoMessageThreads.collegeId,collegeId),
   eq(placementTpoMessageThreads.jobId,jobId)))
 .groupBy(placementTpoMessageThreads.id,users.displayName)
 .orderBy(desc(sql`max(${placementTpoMessages.createdAt})`)).limit(100);
 return {job,available:true,threads:threads.map(row=>({...row,
  unread:Number(row.unread),count:Number(row.count)}))};
}
