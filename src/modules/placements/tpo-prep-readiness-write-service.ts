import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,courses,departments} from "@/db/schema";
import {placementTpoPrepReadiness} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
const schema=z.object({
 courseIds:z.array(z.string().uuid()).max(40)
  .refine(ids=>new Set(ids).size===ids.length,"Duplicate course"),
 minimumCompleted:z.number().int().min(0).max(40),
 expectedVersion:z.union([z.iso.datetime({offset:true}),z.literal("none")]),
}).strict().refine(row=>row.minimumCompleted<=row.courseIds.length,"Minimum exceeds required courses");
export class PrepReadinessError extends Error{
 constructor(public readonly code:"PREP_STALE"|"PREP_INVALID_COURSE"|"PREP_STORAGE_PENDING"|"PREP_COLLEGE_NOT_FOUND"){
  super(code);this.name="PrepReadinessError";
 }
}
export async function setTpoPrepReadiness(context:RequestContext,raw:unknown){
 const input=schema.parse(raw),collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_prep_readiness"))throw new PrepReadinessError("PREP_STORAGE_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new PrepReadinessError("PREP_COLLEGE_NOT_FOUND");
  if(input.courseIds.length){
   const available=await tx.select({id:courses.id}).from(courses)
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .where(and(eq(departments.collegeId,collegeId),eq(courses.status,"ACTIVE"),inArray(courses.id,input.courseIds)));
   if(available.length!==input.courseIds.length)throw new PrepReadinessError("PREP_INVALID_COURSE");
  }
  const [current]=await tx.select().from(placementTpoPrepReadiness)
   .where(eq(placementTpoPrepReadiness.collegeId,collegeId)).limit(1);
  if((current?.updatedAt.toISOString()??"none")!==input.expectedVersion)throw new PrepReadinessError("PREP_STALE");
  const prior=current?.config && typeof current.config==="object" && !Array.isArray(current.config)
   ? current.config as Record<string,unknown>:{};
  const config={...prior,courseIds:input.courseIds,minimumCompleted:input.minimumCompleted};
  const updatedAt=new Date();
  await tx.insert(placementTpoPrepReadiness).values({collegeId,config,updatedAt})
   .onConflictDoUpdate({target:placementTpoPrepReadiness.collegeId,set:{config,updatedAt}});
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:context.user.id,actorMembershipId:context.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_prep_readiness.updated",subjectType:"COLLEGE",subjectId:collegeId,
   summary:"TPO updated placement preparation readiness policy",
   metadata:{requiredCourseCount:input.courseIds.length,minimumCompleted:input.minimumCompleted}});
  return {changed:true,updatedAt:updatedAt.toISOString()};
 });
}
