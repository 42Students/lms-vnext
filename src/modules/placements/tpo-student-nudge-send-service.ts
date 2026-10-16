import "server-only";
import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
 activityEvents,collegeMemberships,inAppNotifications,membershipRoles,users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "./scope";
import { requireTpoBatchActor } from "./tpo-batch-workspace-read-service";
import { tpoStudentNudgeInputSchema } from "./tpo-student-nudge-send-model";

/** TPO-students-04: private, tenant-scoped in-app delivery and transactional audit.
 * Repeating the same exact message to the same recipient on the same UTC day is
 * idempotent, not a second notification. Never write free text to the audit log.
 */
export async function sendTpoStudentNudges(context:RequestContext,raw:unknown){
 const input=tpoStudentNudgeInputSchema.parse(raw);
 const collegeId=await requireTpoBatchActor(context);
 const college=await requirePlacementManageScope(context,collegeId);
 const digest=createHash("sha256").update(input.template+"\0"+input.message).digest("hex");
 const now=new Date(),day=now.toISOString().slice(0,10);
 const membership=context.membership;
 if(!membership)throw new AuthorizationError("placements.manage");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId,
  });
  const recipients=await tx.select({
   membershipId:collegeMemberships.id,userId:collegeMemberships.userId,
  }).from(collegeMemberships)
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER"),
   ))
   .where(and(
    eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
    inArray(collegeMemberships.id,input.learnerMembershipIds),
   ));
  if(recipients.length!==input.learnerMembershipIds.length)
   throw new AuthorizationError("placements.manage");
  let sent=0,skipped=0;
  for(const recipient of recipients){
   const [event]=await tx.insert(activityEvents).values({
    organizationId:college.organizationId,collegeId,
    actorUserId:context.user.id,actorMembershipId:membership.id,
    module:"PLACEMENTS",eventType:"placements.student.nudge_sent",
    subjectType:"COLLEGE_MEMBERSHIP",subjectId:recipient.membershipId,
    summary:"TPO sent an in-app placement follow-up",
    metadata:{template:input.template},
    dedupeKey:"tpo-student-nudge:"+collegeId+":"+recipient.membershipId+":"+day+":"+digest,
   }).onConflictDoNothing().returning({id:activityEvents.id});
   if(!event){skipped++;continue;}
   await tx.insert(inAppNotifications).values({
    userId:recipient.userId,eventId:event.id,
    title:"Message from Placement Cell",body:input.message,
    actionHref:"/learn/placements",
   });
   sent++;
  }
  return {sent,skipped};
 });
}
