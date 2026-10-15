import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {placementTpoInternalThreads} from "@/db/schema/tpo-internal";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {internalThreadSchema} from "./tpo-team-internal-model";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

/** A new internal thread requires an active, persisted TPO recipient from this college. */
export async function createTpoInternalThread(context:RequestContext,raw:unknown) {
 const input=internalThreadSchema.parse(raw);
 const own=context.membership;
 if(!own||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 if(input.recipientMembershipId===own.id)throw new Error("TEAM_RECIPIENT_NOT_FOUND");
 const college=await requirePlacementManageScope(context,own.collegeId);
 if(!await placementTableExists("placement_tpo_internal_threads"))throw new Error("TEAM_TABLES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [recipient]=await tx.select({id:collegeMemberships.id})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
     eq(membershipRoles.role,"TPO")))
   .where(and(eq(collegeMemberships.id,input.recipientMembershipId),
     eq(collegeMemberships.collegeId,college.id),
     eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
   .for("share").limit(1);
  if(!recipient)throw new Error("TEAM_RECIPIENT_NOT_FOUND");
  const [thread]=await tx.insert(placementTpoInternalThreads).values({
   collegeId:college.id,startedByMembershipId:own.id,
   invitedMembershipId:recipient.id,topic:input.topic,
  }).returning({id:placementTpoInternalThreads.id});
  if(!thread)throw new Error("TEAM_THREAD_CREATE_FAILED");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:own.id,
   module:"PLACEMENTS",eventType:"placements.tpo_team.thread_created",
   subjectType:"team_thread",subjectId:thread.id,
   summary:"Private TPO team thread created",metadata:{threadId:thread.id},
  });
  return thread;
 });
}
