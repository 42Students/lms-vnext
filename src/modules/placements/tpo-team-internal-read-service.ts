import "server-only";
import {and,desc,eq,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
import {tpoInternalThreads} from "./tpo-team-staged-schema";
/** Read only threads where the active TPO membership is a named participant. */
export async function listMyTpoInternalThreads(context:RequestContext){
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_threads"))
  return {status:"NOT_REGISTERED" as const,items:[]};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const items=await tx.select({
   id:tpoInternalThreads.id,topic:tpoInternalThreads.topic,
   createdAt:tpoInternalThreads.createdAt,
  }).from(tpoInternalThreads)
   .where(and(eq(tpoInternalThreads.collegeId,college.id),
    or(eq(tpoInternalThreads.startedByMembershipId,membership.id),
       eq(tpoInternalThreads.invitedMembershipId,membership.id))))
   .orderBy(desc(tpoInternalThreads.createdAt),desc(tpoInternalThreads.id)).limit(50);
  return {status:"READY" as const,items};
 });
}
