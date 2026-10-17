import "server-only";
import {and,eq,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import {placementTpoInternalThreads} from "@/db/schema/tpo-internal";
import {type RequestContext,hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

export const tpoTeamRenameSchema=z.strictObject({
 threadId:z.string().uuid(),
 topic:z.string().trim().min(1).max(200),
 expectedTopic:z.string().trim().min(1).max(200),
});
/** Both active participants can rename the private conversation; compare the prior title. */
export async function renameTpoTeamThread(context:RequestContext,raw:unknown){
 const input=tpoTeamRenameSchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO")||membership.status!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_threads"))throw new Error("TEAM_TABLES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [thread]=await tx.select({topic:placementTpoInternalThreads.topic})
   .from(placementTpoInternalThreads)
   .where(and(eq(placementTpoInternalThreads.id,input.threadId),
    eq(placementTpoInternalThreads.collegeId,college.id),
    or(eq(placementTpoInternalThreads.startedByMembershipId,membership.id),
       eq(placementTpoInternalThreads.invitedMembershipId,membership.id))))
   .for("update").limit(1);
  if(!thread)throw new Error("TEAM_THREAD_NOT_FOUND");
  if(thread.topic!==input.expectedTopic)throw new Error("TEAM_STALE_TOPIC");
  if(thread.topic===input.topic)return {topic:thread.topic};
  const [updated]=await tx.update(placementTpoInternalThreads)
   .set({topic:input.topic}).where(and(eq(placementTpoInternalThreads.id,input.threadId),
    eq(placementTpoInternalThreads.collegeId,college.id),
    eq(placementTpoInternalThreads.topic,input.expectedTopic)))
   .returning({topic:placementTpoInternalThreads.topic});
  if(!updated)throw new Error("TEAM_STALE_TOPIC");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorMembershipId:membership.id,actorUserId:context.user.id,
   module:"PLACEMENTS",eventType:"placements.tpo_team.topic_renamed",
   subjectType:"team_thread",subjectId:input.threadId,
   summary:"Private TPO team conversation renamed",
   metadata:{threadId:input.threadId},
  });
  return updated;
 });
}
