import "server-only";
import {and,desc,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {placementTpoStudentNotes} from "@/db/schema/tpo-collaboration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {requirePlacementManageScope} from "./scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
export const tpoStudentNotesInput=z.strictObject({
 membershipIds:z.array(z.uuid()).min(1).max(100)
  .refine(ids=>new Set(ids).size===ids.length,"Duplicate students are not allowed."),
 note:z.string().trim().min(1).max(2000),
});
export async function addTpoStudentNotes(ctx:RequestContext,raw:unknown){
 const input=tpoStudentNotesInput.parse(raw);
 const collegeId=await requireTpoBatchActor(ctx);
 const college=await requirePlacementManageScope(ctx,collegeId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const matched=await tx.select({id:collegeMemberships.id})
   .from(collegeMemberships)
   .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
    eq(users.platformStatus,"ACTIVE")))
   .where(and(inArray(collegeMemberships.id,input.membershipIds),
    eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE")));
  const eligible=new Set(matched.map(r=>r.id));
  const saved:string[]=[];
  for(const id of input.membershipIds){
   if(!eligible.has(id))continue;
   const [record]=await tx.insert(placementTpoStudentNotes).values({
    collegeId,learnerMembershipId:id,note:input.note,
    createdByUserId:ctx.user.id,
   }).returning({id:placementTpoStudentNotes.id});
   saved.push(id);
   await tx.insert(activityEvents).values({
    organizationId:college.organizationId,collegeId,
    actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
    module:"PLACEMENTS",eventType:"PLACEMENTS_TPO_STUDENT_NOTE_ADDED",
    subjectType:"college_membership",subjectId:id,
    summary:"TPO student internal note added",
    metadata:{noteId:record.id,studentId:id},
   });
  }
  return {ok:true as const,added:saved.length,skipped:input.membershipIds.length-saved.length,
   savedMembershipIds:saved};
 });
}
export async function listTpoStudentNotes(ctx:RequestContext,rawId:unknown){
 const id=z.uuid().parse(rawId),collegeId=await requireTpoBatchActor(ctx);
 await requirePlacementManageScope(ctx,collegeId);
 const db=getDb();
 const [learner]=await db.select({id:collegeMemberships.id})
  .from(collegeMemberships)
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE")))
  .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE")))
  .limit(1);
 if(!learner)return null;
 return db.select({id:placementTpoStudentNotes.id,note:placementTpoStudentNotes.note,
  createdAt:placementTpoStudentNotes.createdAt,
  authorUserId:placementTpoStudentNotes.createdByUserId})
  .from(placementTpoStudentNotes)
  .where(and(eq(placementTpoStudentNotes.collegeId,collegeId),
    eq(placementTpoStudentNotes.learnerMembershipId,id)))
  .orderBy(desc(placementTpoStudentNotes.createdAt)).limit(100);
}
