import "server-only";
import {and,eq,inArray,isNull,sql} from "drizzle-orm";
import {tpoPrepReadinessSaveSchema,tpoPrepReadinessSamePolicy} from "./tpo-prep-readiness-save-model";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {getDb} from "@/db/client";
import {activityEvents,colleges,courses,departments} from "@/db/schema";
import {placementTpoPrepReadiness} from "@/db/schema/tpo-configuration";
import {placementTpoPrepCourses} from "@/db/schema/tpo-collaboration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
export class PrepReadinessError extends Error{
 constructor(public readonly code:"PREP_STALE"|"PREP_INVALID_COURSE"|"PREP_STORAGE_PENDING"|"PREP_COLLEGE_NOT_FOUND"){
  super(code);this.name="PrepReadinessError";
 }
}
export async function setTpoPrepReadiness(context:RequestContext,raw:unknown){
 const input=tpoPrepReadinessSaveSchema.parse(raw),collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_prep_readiness")||
    !await placementTableExists("placement_tpo_prep_courses"))
   throw new PrepReadinessError("PREP_STORAGE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new PrepReadinessError("PREP_COLLEGE_NOT_FOUND");
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [current]=await tx.select().from(placementTpoPrepReadiness)
   .where(eq(placementTpoPrepReadiness.collegeId,collegeId)).limit(1);
  // Compare both the legacy configuration and the normalized selected rows.
  // A previous partial/legacy write must not appear idempotent while the
  // DB09 course-selection relation is empty or out of sync.
  const selected=await tx.select({courseId:placementTpoPrepCourses.courseId})
    .from(placementTpoPrepCourses).where(eq(placementTpoPrepCourses.collegeId,collegeId))
    .orderBy(placementTpoPrepCourses.courseId);
  const normalizedMatches=selected.length===input.courseIds.length&&
    input.courseIds.every(id=>selected.some(row=>row.courseId===id));
  if(current&&normalizedMatches&&tpoPrepReadinessSamePolicy(current.config,input))
   return {changed:false,updatedAt:current.updatedAt.toISOString()};
  if((current?.updatedAt.toISOString()??"none")!==input.expectedVersion)
   throw new PrepReadinessError("PREP_STALE");
  if(input.courseIds.length){
   const available=await tx.select({id:courses.id}).from(courses)
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .innerJoin(colleges,eq(colleges.id,departments.collegeId))
    .where(and(eq(colleges.organizationId,college.organizationId),
     eq(colleges.status,"ACTIVE"),isNull(departments.archivedAt),
     eq(courses.status,"ACTIVE"),eq(courses.enabled,true),isNull(courses.deletedAt),
     inArray(courses.id,input.courseIds)));
   if(new Set(available.map(row=>row.id)).size!==input.courseIds.length)
    throw new PrepReadinessError("PREP_INVALID_COURSE");
  }
  const prior=current?.config&&typeof current.config==="object"&&!Array.isArray(current.config)
   ? current.config as Record<string,unknown>:{};
  const config={...prior,courseIds:input.courseIds,minimumCompleted:input.minimumCompleted};
  const [saved]=await tx.insert(placementTpoPrepReadiness).values({
   collegeId,config,updatedAt:new Date(),
  }).onConflictDoUpdate({
   target:placementTpoPrepReadiness.collegeId,
   set:{config,updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoPrepReadiness.updatedAt}) + interval '1 millisecond')`},
  }).returning({updatedAt:placementTpoPrepReadiness.updatedAt});
  if(!saved)throw new PrepReadinessError("PREP_STORAGE_PENDING");
  // The normalized set is in the same transaction as JSON compatibility
  // fields, CAS version and immutable activity. Empty selection deletes all
  // rows; a failed insert rolls back the JSON change and audit together.
  await tx.delete(placementTpoPrepCourses)
    .where(eq(placementTpoPrepCourses.collegeId,collegeId));
  if(input.courseIds.length)await tx.insert(placementTpoPrepCourses).values(
    input.courseIds.map(courseId=>({collegeId,courseId,createdByUserId:context.user.id}))
  );
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:context.user.id,actorMembershipId:context.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_prep_readiness.updated",subjectType:"COLLEGE",subjectId:collegeId,
   summary:"TPO updated placement preparation readiness policy",
   metadata:{requiredCourseCount:input.courseIds.length,minimumCompleted:input.minimumCompleted}});
  return {changed:true,updatedAt:saved.updatedAt.toISOString()};
 });
}
