import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
export async function listCollegeStudentImportHistory(ctx:RequestContext,raw:unknown){
 const page=z.coerce.number().int().min(1).max(500).parse(raw??1);
 const member=ctx.membership;
 if(!member||member.status!=="ACTIVE"||!hasMembershipRole(ctx,"COLLEGE_ADMIN"))
  throw new AuthorizationError("people.manage");
 requirePermission(ctx,"people.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
 const rows=await getDb().select({
  id:activityEvents.id,when:activityEvents.occurredAt,
  summary:activityEvents.summary,metadata:activityEvents.metadata,
 }).from(activityEvents).where(and(
  eq(activityEvents.collegeId,member.collegeId),
  eq(activityEvents.eventType,"IDENTITY_COLLEGE_STUDENT_CSV_IMPORT")))
  .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id))
  .limit(21).offset((page-1)*20);
 return{page,items:rows.slice(0,20).map(row=>({
  id:row.id,when:row.when,
  students:typeof row.metadata.count==="number"?row.metadata.count:0,
  imported:typeof row.metadata.created==="number"?row.metadata.created:0,
  partial:typeof row.metadata.partial==="number"?row.metadata.partial:0,
  failed:typeof row.metadata.failed==="number"?row.metadata.failed:0,
 })),hasNext:rows.length>20};
}
