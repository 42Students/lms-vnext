import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges} from "@/db/schema";
import {placementTpoJobTypes} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {tpoJobTypeNameSchema} from "./tpo-configuration-model";
import {isTpoBuiltinJobType} from "./tpo-builtin-job-types";
const createSchema=z.object({label:tpoJobTypeNameSchema}).strict();
export class TpoConfigError extends Error{
 constructor(public readonly code:"TPO_SETTINGS_PENDING"|"TPO_JOB_TYPE_EXISTS"|"TPO_SETTINGS_STALE"|"TPO_SETTINGS_NOT_FOUND"|"TPO_JOB_TYPE_LIMIT"|"TPO_JOB_TYPE_LAST_ACTIVE"|"TPO_JOB_TYPE_BUILTIN"){
  super(code);this.name="TpoConfigError";
 }
}
export async function createTpoJobType(context:RequestContext,raw:unknown){
 const input=createSchema.parse(raw),collegeId=await requireTpoBatchActor(context);
 if(isTpoBuiltinJobType(input.label))throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  const [existing]=await tx.select({id:placementTpoJobTypes.id}).from(placementTpoJobTypes)
   .where(and(eq(placementTpoJobTypes.collegeId,collegeId),
    sql`lower(${placementTpoJobTypes.label}) = lower(${input.label}::text)`)).limit(1);
  if(existing)throw new TpoConfigError("TPO_JOB_TYPE_EXISTS");
  const [{count}]=await tx.select({count:sql<number>`count(*)::integer`}).from(placementTpoJobTypes)
   .where(eq(placementTpoJobTypes.collegeId,collegeId));
  if(count>=30)throw new TpoConfigError("TPO_JOB_TYPE_LIMIT");
  const [created]=await tx.insert(placementTpoJobTypes).values({
   collegeId,label:input.label,active:true,
  }).returning({id:placementTpoJobTypes.id,label:placementTpoJobTypes.label});
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:context.user.id,
   actorMembershipId:context.membership!.id,module:"PLACEMENTS",eventType:"placements.tpo_job_type.created",
   subjectType:"JOB_TYPE",subjectId:created.id,summary:"TPO added a college job type",
   metadata:{label:created.label},
  });
  return created;
 });
}

const statusSchema=z.object({
 jobTypeId:z.string().uuid(),active:z.boolean(),
 expectedVersion:z.iso.datetime({offset:true}),
}).strict();
export async function setTpoJobTypeActive(context:RequestContext,raw:unknown){
 const input=statusSchema.parse(raw),collegeId=await requireTpoBatchActor(context);
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  const [current]=await tx.select().from(placementTpoJobTypes).where(and(
   eq(placementTpoJobTypes.id,input.jobTypeId),eq(placementTpoJobTypes.collegeId,collegeId))).limit(1);
  if(!current)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  if(current.updatedAt.toISOString()!==input.expectedVersion)throw new TpoConfigError("TPO_SETTINGS_STALE");
  if(current.active===input.active)return {changed:false,updatedAt:current.updatedAt.toISOString()};
  if(!input.active){
   const [{count}]=await tx.select({count:sql<number>`count(*)::integer`}).from(placementTpoJobTypes)
    .where(and(eq(placementTpoJobTypes.collegeId,collegeId),eq(placementTpoJobTypes.active,true)));
   if(count<=1)throw new TpoConfigError("TPO_JOB_TYPE_LAST_ACTIVE");
  }
  const [updated]=await tx.update(placementTpoJobTypes).set({active:input.active,updatedAt:new Date()})
   .where(and(eq(placementTpoJobTypes.id,current.id),eq(placementTpoJobTypes.collegeId,collegeId))).returning();
  if(!updated)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:context.user.id,
   actorMembershipId:context.membership!.id,module:"PLACEMENTS",eventType:"placements.tpo_job_type.status_changed",
   subjectType:"JOB_TYPE",subjectId:current.id,
   summary:input.active?"TPO enabled a job type":"TPO disabled a job type",
   metadata:{active:input.active},
  });
  return {changed:true,updatedAt:updated.updatedAt.toISOString()};
 });
}

const renameSchema=z.object({jobTypeId:z.string().uuid(),label:tpoJobTypeNameSchema,
 expectedVersion:z.iso.datetime({offset:true})}).strict();
export async function renameTpoJobType(ctx:RequestContext,raw:unknown){
 const input=renameSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 if(isTpoBuiltinJobType(input.label))throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId}).from(colleges)
   .where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  const [current]=await tx.select().from(placementTpoJobTypes).where(and(
   eq(placementTpoJobTypes.collegeId,collegeId),eq(placementTpoJobTypes.id,input.jobTypeId)))
   .for("update").limit(1);
  if(!current)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  if(current.updatedAt.toISOString()!==input.expectedVersion)throw new TpoConfigError("TPO_SETTINGS_STALE");
  const [existing]=await tx.select({id:placementTpoJobTypes.id}).from(placementTpoJobTypes)
   .where(and(eq(placementTpoJobTypes.collegeId,collegeId),
    sql`lower(${placementTpoJobTypes.label}) = lower(${input.label}::text)`)).limit(1);
  if(existing&&existing.id!==current.id)throw new TpoConfigError("TPO_JOB_TYPE_EXISTS");
  if(current.label===input.label)return {changed:false,updatedAt:current.updatedAt.toISOString()};
  const [updated]=await tx.update(placementTpoJobTypes).set({label:input.label,updatedAt:new Date()})
   .where(and(eq(placementTpoJobTypes.id,current.id),eq(placementTpoJobTypes.collegeId,collegeId),
    eq(placementTpoJobTypes.updatedAt,current.updatedAt))).returning();
  if(!updated)throw new TpoConfigError("TPO_SETTINGS_STALE");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:ctx.user.id,
   actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",eventType:"placements.tpo_job_type.renamed",
   subjectType:"JOB_TYPE",subjectId:current.id,summary:"TPO renamed a custom job type",
   metadata:{from:current.label,to:updated.label},
  });
  return {changed:true,updatedAt:updated.updatedAt.toISOString()};
 });
}
