import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
/** Legacy imported-row counters are trustworthy only when nonnegative integers. */
function safeCount(value:unknown):number{
 return typeof value==="number"&&Number.isSafeInteger(value)&&value>=0?value:0;
}
export async function listCollegeStudentImportHistory(ctx:RequestContext,raw:unknown){
 const page=z.union([
  z.number().int().min(1).max(500),
  z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(1).max(500)),
 ]).parse(raw??1);
 const member=ctx.membership;
 if(!member||member.status!=="ACTIVE"||!hasMembershipRole(ctx,"COLLEGE_ADMIN"))
  throw new AuthorizationError("people.manage");
 requirePermission(ctx,"people.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
 // History contains person import results; a stale session cannot read it
 // after its College Admin membership or user has been revoked.
 const rows=await getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"people.manage",{
   collegeId:member.collegeId,organizationId:member.organizationId,
  });
  return tx.select({
  id:activityEvents.id,when:activityEvents.occurredAt,
  summary:activityEvents.summary,metadata:activityEvents.metadata,
 }).from(activityEvents).where(and(
  eq(activityEvents.collegeId,member.collegeId),
  eq(activityEvents.eventType,"IDENTITY_COLLEGE_STUDENT_CSV_IMPORT")))
  .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id))
  .limit(21).offset((page-1)*20);
 });
 return{page,items:rows.slice(0,20).map(row=>({
  id:row.id,when:row.when,
  students:safeCount(row.metadata.count),
  imported:safeCount(row.metadata.created),
  partial:safeCount(row.metadata.partial),
  failed:safeCount(row.metadata.failed),
 })),hasNext:rows.length>20};
}
