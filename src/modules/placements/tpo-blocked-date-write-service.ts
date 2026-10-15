import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges} from "@/db/schema";
import {placementTpoBlockedDates} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
const inputSchema=z.object({day:z.iso.date(),reason:z.string().trim().min(3).max(500)}).strict();
export class BlockedDateError extends Error {
 constructor(public readonly code:"DATE_PENDING"|"DATE_EXISTS"|"DATE_NOT_FOUND"|"DATE_STALE"){super(code);}
}
export async function createBlockedDate(ctx:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 if(!await placementTableExists("placement_tpo_blocked_dates"))throw new BlockedDateError("DATE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new BlockedDateError("DATE_NOT_FOUND");
  const [found]=await tx.select({id:placementTpoBlockedDates.id}).from(placementTpoBlockedDates)
   .where(and(eq(placementTpoBlockedDates.collegeId,collegeId),eq(placementTpoBlockedDates.day,input.day))).limit(1);
  if(found)throw new BlockedDateError("DATE_EXISTS");
  const [row]=await tx.insert(placementTpoBlockedDates).values({...input,collegeId})
   .returning({id:placementTpoBlockedDates.id,day:placementTpoBlockedDates.day});
  if(!row)throw new BlockedDateError("DATE_NOT_FOUND");
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_blocked_date.created",subjectType:"BLOCKED_DATE",subjectId:row.id,
   summary:"TPO blocked a placement scheduling date",metadata:{day:row.day}});
  return row;
 });
}

const deleteSchema=z.object({id:z.string().uuid(),expectedVersion:z.iso.datetime({offset:true})}).strict();
export async function deleteBlockedDate(ctx:RequestContext,raw:unknown){
 const input=deleteSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 if(!await placementTableExists("placement_tpo_blocked_dates"))throw new BlockedDateError("DATE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new BlockedDateError("DATE_NOT_FOUND");
  const [current]=await tx.select().from(placementTpoBlockedDates)
   .where(and(eq(placementTpoBlockedDates.id,input.id),eq(placementTpoBlockedDates.collegeId,collegeId))).limit(1);
  if(!current)throw new BlockedDateError("DATE_NOT_FOUND");
  if(current.updatedAt.toISOString()!==input.expectedVersion)throw new BlockedDateError("DATE_STALE");
  await tx.delete(placementTpoBlockedDates).where(and(eq(placementTpoBlockedDates.id,current.id),
   eq(placementTpoBlockedDates.collegeId,collegeId)));
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_blocked_date.removed",subjectType:"BLOCKED_DATE",subjectId:current.id,
   summary:"TPO removed a blocked placement date",metadata:{day:current.day}});
  return {removed:true,id:current.id};
 });
}
