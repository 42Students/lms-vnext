import "server-only";
import {randomUUID} from "node:crypto";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,placementEligibilityDecisions,placementEligibilityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
const inputSchema=z.strictObject({confirmed:z.literal(true),runAuditId:z.string().uuid()});
const rowSchema=z.strictObject({membershipId:z.string().uuid(),actionId:z.string().uuid(),
 afterUpdatedAt:z.iso.datetime({offset:true}).nullable()});
export class TpoStudentBulkUndoError extends Error {
 constructor(readonly code:"NOT_FOUND"|"STALE"|"EXPIRED"|"ALREADY_UNDONE"|"UNSAFE_RUN"){
  super(code);
 }
}
/** Undo only the original actor's last five-minute source-backed membership writes.
 * An audit-row lock serializes competing Undo operations and each current
 * eligibility event must still be the original run's latest event. */
export async function undoTpoStudentBulkRun(ctx:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw),member=ctx.membership;
 if(!member||member.status!=="ACTIVE"||ctx.user.platformStatus!=="ACTIVE"||!hasMembershipRole(ctx,"TPO"))
  throw new AuthorizationError("placements.manage");
 const collegeId=member.collegeId;
 if(!can(ctx,"placements.manage",{collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(ctx,"placements.manage",{collegeId});
 const college=await requirePlacementManageScope(ctx,collegeId);
 return getDb().transaction(async tx=>{
  const [run]=await tx.select().from(activityEvents).where(and(
   eq(activityEvents.id,input.runAuditId),eq(activityEvents.collegeId,college.id),
   eq(activityEvents.eventType,"PLACEMENTS_BULK_RUN"),eq(activityEvents.actorUserId,ctx.user.id),
   eq(activityEvents.actorMembershipId,member.id),
  )).for("update").limit(1);
  if(!run||run.metadata.target!=="STUDENTS")throw new TpoStudentBulkUndoError("NOT_FOUND");
  const age=Date.now()-run.occurredAt.getTime();
  if(age<0||age>300000)throw new TpoStudentBulkUndoError("EXPIRED");
  const rows=z.array(rowSchema).min(1).max(200).safeParse(run.metadata.undoRows);
  if(!rows.success||new Set(rows.data.map(row=>row.membershipId)).size!==rows.data.length)
   throw new TpoStudentBulkUndoError("UNSAFE_RUN");
  const [already]=await tx.select({id:activityEvents.id}).from(activityEvents).where(
   eq(activityEvents.dedupeKey,"tpo-students-bulk-undo:"+input.runAuditId)).limit(1);
  if(already)throw new TpoStudentBulkUndoError("ALREADY_UNDONE");
  const list=[...rows.data].sort((a,b)=>a.membershipId.localeCompare(b.membershipId));
  const inverseActionId=randomUUID(),now=new Date();
  for(const row of list){
   const [original]=await tx.select().from(placementEligibilityEvents).where(and(
    eq(placementEligibilityEvents.collegeId,college.id),
    eq(placementEligibilityEvents.actionId,row.actionId),
    eq(placementEligibilityEvents.scopeType,"MEMBERSHIP"),
    eq(placementEligibilityEvents.scopeId,row.membershipId),
    eq(placementEligibilityEvents.actorUserId,ctx.user.id),
   )).limit(1);
   const [latest]=await tx.select({actionId:placementEligibilityEvents.actionId}).from(placementEligibilityEvents).where(and(
    eq(placementEligibilityEvents.collegeId,college.id),
    eq(placementEligibilityEvents.scopeType,"MEMBERSHIP"),
    eq(placementEligibilityEvents.scopeId,row.membershipId),
   )).orderBy(desc(placementEligibilityEvents.sequence)).limit(1);
   if(!original||!latest||latest.actionId!==row.actionId)throw new TpoStudentBulkUndoError("STALE");
   const [current]=await tx.select().from(placementEligibilityDecisions).where(and(
    eq(placementEligibilityDecisions.collegeId,college.id),
    eq(placementEligibilityDecisions.scopeType,"MEMBERSHIP"),
    eq(placementEligibilityDecisions.scopeId,row.membershipId),
   )).for("update").limit(1);
   if(original.afterStatus!==current?.status&&!(original.afterStatus===null&&current===undefined))
    throw new TpoStudentBulkUndoError("STALE");
   if((current?.updatedAt.toISOString()??null)!==row.afterUpdatedAt)
    throw new TpoStudentBulkUndoError("STALE");
   if(original.beforeStatus===null){
    if(current)await tx.delete(placementEligibilityDecisions).where(eq(placementEligibilityDecisions.id,current.id));
   }else if(current){
    await tx.update(placementEligibilityDecisions).set({
     status:original.beforeStatus,reason:original.beforeReason,
     note:original.beforeNote,decidedByUserId:ctx.user.id,
     decidedAt:now,updatedAt:now,
    }).where(eq(placementEligibilityDecisions.id,current.id));
   }else{
    await tx.insert(placementEligibilityDecisions).values({
     collegeId:college.id,scopeType:"MEMBERSHIP",scopeId:row.membershipId,
     status:original.beforeStatus,reason:original.beforeReason,
     note:original.beforeNote,decidedByUserId:ctx.user.id,decidedAt:now,updatedAt:now,
    });
   }
   await tx.insert(placementEligibilityEvents).values({
    collegeId:college.id,actionId:inverseActionId,reversesActionId:row.actionId,eventKind:"UNDO",
    scopeType:"MEMBERSHIP",scopeId:row.membershipId,
    beforeStatus:original.afterStatus,beforeReason:original.afterReason,beforeNote:original.afterNote,
    afterStatus:original.beforeStatus,afterReason:original.beforeReason,afterNote:original.beforeNote,
    actorUserId:ctx.user.id,
   });
  }
  const [audit]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:ctx.user.id,actorMembershipId:member.id,module:"PLACEMENTS",
   eventType:"PLACEMENTS_BULK_UNDONE",subjectType:"placement_college",
   subjectId:college.id,summary:"Undid student eligibility bulk decisions",
   metadata:{runAuditId:input.runAuditId,restored:list.length},
   dedupeKey:"tpo-students-bulk-undo:"+input.runAuditId,
  }).returning({id:activityEvents.id});
  if(!audit)throw new TpoStudentBulkUndoError("ALREADY_UNDONE");
  return {restored:list.length,undoAuditId:audit.id};
 });
}
