import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges} from "@/db/schema";
import {placementTpoBlockedDates} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {tpoIndiaCalendarDay} from "./tpo-local-date-model";
const inputSchema=z.object({
 day:z.iso.date().optional(),startDay:z.iso.date().optional(),endDay:z.iso.date().optional(),
 reason:z.string().trim().min(3).max(500).optional(),
}).strict();
function rangeDays(start:string,end:string):string[]{
 const first=Date.parse(start+"T00:00:00Z"),last=Date.parse(end+"T00:00:00Z");
 const count=Math.round((last-first)/86400000)+1;
 if(!Number.isFinite(count)||count<1||count>90)throw new BlockedDateError("DATE_RANGE_INVALID");
 return Array.from({length:count},(_,index)=>new Date(first+index*86400000).toISOString().slice(0,10));
}
export class BlockedDateError extends Error {
 constructor(public readonly code:"DATE_PENDING"|"DATE_EXISTS"|"DATE_NOT_FOUND"|"DATE_STALE"|"DATE_RANGE_INVALID"|"DATE_IN_PAST"){super(code);}
}
export async function createBlockedDate(ctx:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 const start=input.startDay??input.day,end=input.endDay??input.day;
 if(!start||!end||(input.day&&input.startDay))throw new BlockedDateError("DATE_RANGE_INVALID");
 const days=rangeDays(start,end);
 if(start<tpoIndiaCalendarDay(new Date()))throw new BlockedDateError("DATE_IN_PAST");
 const reason=input.reason??"Blocked";
 if(!await placementTableExists("placement_tpo_blocked_dates"))throw new BlockedDateError("DATE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new BlockedDateError("DATE_NOT_FOUND");
  // Revalidate the persisted TPO/College Admin role while holding the
  // college lock: request-context permissions may have been revoked.
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const existing=await tx.select({day:placementTpoBlockedDates.day}).from(placementTpoBlockedDates)
   .where(and(eq(placementTpoBlockedDates.collegeId,collegeId),inArray(placementTpoBlockedDates.day,days)));
  if(existing.length)throw new BlockedDateError("DATE_EXISTS");
  const rows=await tx.insert(placementTpoBlockedDates).values(days.map(day=>({day,reason,collegeId})))
   .returning({id:placementTpoBlockedDates.id,day:placementTpoBlockedDates.day});
  const firstRow=rows[0];
  if(!firstRow||rows.length!==days.length)throw new BlockedDateError("DATE_NOT_FOUND");
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_blocked_date.created",subjectType:"BLOCKED_DATE",subjectId:firstRow.id,
   summary:"TPO blocked placement scheduling dates",metadata:{startDay:start,endDay:end,days:days.length,reason}});
  return {rows,created:rows.length};
 });
}

const deleteSchema=z.object({id:z.string().uuid(),expectedVersion:z.iso.datetime({offset:true})}).strict();
export async function deleteBlockedDate(ctx:RequestContext,raw:unknown){
 const input=deleteSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 if(!await placementTableExists("placement_tpo_blocked_dates"))throw new BlockedDateError("DATE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new BlockedDateError("DATE_NOT_FOUND");
  // Revalidate the persisted TPO/College Admin role while holding the
  // college lock: request-context permissions may have been revoked.
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
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

const removeRangeSchema=z.object({
 startDay:z.iso.date(),endDay:z.iso.date(),
 versions:z.array(z.object({id:z.string().uuid(),expectedVersion:z.iso.datetime({offset:true})}).strict()).min(1).max(90),
}).strict();
export async function removeBlockedRange(ctx:RequestContext,raw:unknown){
 const input=removeRangeSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 const days=rangeDays(input.startDay,input.endDay);
 if(days.length!==input.versions.length)throw new BlockedDateError("DATE_RANGE_INVALID");
 if(!await placementTableExists("placement_tpo_blocked_dates"))throw new BlockedDateError("DATE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status}).from(colleges)
    .where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new BlockedDateError("DATE_NOT_FOUND");
  // Revalidate the persisted TPO/College Admin role while holding the
  // college lock: request-context permissions may have been revoked.
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const records=await tx.select().from(placementTpoBlockedDates)
    .where(and(eq(placementTpoBlockedDates.collegeId,collegeId),
     inArray(placementTpoBlockedDates.id,input.versions.map(v=>v.id)))).for("update");
  if(records.length!==days.length||
     records.some(item=>!days.includes(item.day)||
      input.versions.find(v=>v.id===item.id)?.expectedVersion!==item.updatedAt.toISOString()))
   throw new BlockedDateError("DATE_STALE");
  await tx.delete(placementTpoBlockedDates).where(and(
   eq(placementTpoBlockedDates.collegeId,collegeId),
   inArray(placementTpoBlockedDates.id,input.versions.map(v=>v.id))));
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_blocked_range.removed",
   subjectType:"BLOCKED_DATE",subjectId:records[0]!.id,
   summary:"TPO removed a blocked scheduling range",
   metadata:{startDay:input.startDay,endDay:input.endDay,count:days.length}});
  return {removed:days.length};
 });
}
