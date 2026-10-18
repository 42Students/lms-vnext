import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges} from "@/db/schema";
import {placementTpoJobTypes} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {tpoJobTypeNameSchema} from "./tpo-configuration-model";
import {TPO_BUILTIN_JOB_TYPES,isTpoBuiltinJobType} from "./tpo-builtin-job-types";
const createSchema=z.object({label:tpoJobTypeNameSchema,countsAsPlaced:z.boolean()}).strict();
export class TpoConfigError extends Error{
 constructor(public readonly code:"TPO_SETTINGS_PENDING"|"TPO_JOB_TYPE_EXISTS"|"TPO_SETTINGS_STALE"|"TPO_SETTINGS_NOT_FOUND"|"TPO_JOB_TYPE_LIMIT"|"TPO_JOB_TYPE_LAST_ACTIVE"|"TPO_JOB_TYPE_BUILTIN"|"TPO_JOB_TYPE_IN_USE"){
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
  // A stale request snapshot cannot authorize a write after role revocation.
  // The persisted actor SHARE locks remain held through the settings mutation.
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [existing]=await tx.select({id:placementTpoJobTypes.id}).from(placementTpoJobTypes)
   .where(and(eq(placementTpoJobTypes.collegeId,collegeId),
    sql`lower(${placementTpoJobTypes.label}) = lower(${input.label}::text)`)).limit(1);
  if(existing)throw new TpoConfigError("TPO_JOB_TYPE_EXISTS");
  const [{count}]=await tx.select({count:sql<number>`count(*)::integer`}).from(placementTpoJobTypes)
   .where(and(eq(placementTpoJobTypes.collegeId,collegeId),eq(placementTpoJobTypes.isBuiltin,false)));
  if(count>=30)throw new TpoConfigError("TPO_JOB_TYPE_LIMIT");
  const [created]=await tx.insert(placementTpoJobTypes).values({
   collegeId,label:input.label,active:true,countsAsPlaced:input.countsAsPlaced,isBuiltin:false,
  }).returning({id:placementTpoJobTypes.id,label:placementTpoJobTypes.label});
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:context.user.id,
   actorMembershipId:context.membership!.id,module:"PLACEMENTS",eventType:"placements.tpo_job_type.created",
   subjectType:"JOB_TYPE",subjectId:created.id,summary:"TPO added a college job type",
   metadata:{label:created.label,countsAsPlaced:input.countsAsPlaced},
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
  // A stale request snapshot cannot authorize a write after role revocation.
  // The persisted actor SHARE locks remain held through the settings mutation.
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [current]=await tx.select().from(placementTpoJobTypes).where(and(
   eq(placementTpoJobTypes.id,input.jobTypeId),eq(placementTpoJobTypes.collegeId,collegeId))).limit(1);
  if(!current)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  if(current.isBuiltin||isTpoBuiltinJobType(current.label))throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
  if(current.updatedAt.toISOString()!==input.expectedVersion)throw new TpoConfigError("TPO_SETTINGS_STALE");
  if(current.active===input.active)return {changed:false,updatedAt:current.updatedAt.toISOString()};
  if(!input.active){
   const all=await tx.select({label:placementTpoJobTypes.label,active:placementTpoJobTypes.active})
    .from(placementTpoJobTypes).where(eq(placementTpoJobTypes.collegeId,collegeId));
   const activeCustom=all.filter(row=>!isTpoBuiltinJobType(row.label)&&row.active).length;
   const activeFixed=TPO_BUILTIN_JOB_TYPES.filter(fixed=>
    all.find(row=>row.label===fixed.label)?.active??true).length;
   if(activeCustom+activeFixed<=1)throw new TpoConfigError("TPO_JOB_TYPE_LAST_ACTIVE");
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
  // A stale request snapshot cannot authorize a write after role revocation.
  // The persisted actor SHARE locks remain held through the settings mutation.
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [current]=await tx.select().from(placementTpoJobTypes).where(and(
   eq(placementTpoJobTypes.collegeId,collegeId),eq(placementTpoJobTypes.id,input.jobTypeId)))
   .for("update").limit(1);
  if(!current)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  if(current.isBuiltin||isTpoBuiltinJobType(current.label))throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
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

const builtinSchema=z.object({label:z.string().trim(),active:z.boolean(),
 expectedVersion:z.union([z.literal("none"),z.iso.datetime({offset:true})])}).strict();
/** Materialize a built-in override only on an explicit TPO save. Defaults stay virtual. */
export async function setTpoBuiltinJobTypeActive(ctx:RequestContext,raw:unknown){
 const input=builtinSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 const fixed=TPO_BUILTIN_JOB_TYPES.find(row=>row.label===input.label);
 if(!fixed)throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId}).from(colleges)
   .where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  // A stale request snapshot cannot authorize a write after role revocation.
  // The persisted actor SHARE locks remain held through the settings mutation.
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const rows=await tx.select().from(placementTpoJobTypes)
   .where(eq(placementTpoJobTypes.collegeId,collegeId));
  const current=rows.find(row=>row.label.toLocaleLowerCase("en-IN")===fixed.label.toLocaleLowerCase("en-IN"));
  if((current?.updatedAt.toISOString()??"none")!==input.expectedVersion)
   throw new TpoConfigError("TPO_SETTINGS_STALE");
  if(!input.active){
   const builtinActive=TPO_BUILTIN_JOB_TYPES.filter(item=>
    rows.find(row=>row.label===item.label)?.active??true).length;
   const customActive=rows.filter(row=>!isTpoBuiltinJobType(row.label)&&row.active).length;
   const targetActive=current?.active??true;
   if(targetActive&&builtinActive+customActive<=1)throw new TpoConfigError("TPO_JOB_TYPE_LAST_ACTIVE");
  }
  if(!current&&input.active)return {changed:false,updatedAt:"none"};
  if(current?.active===input.active&&current.isBuiltin)return {changed:false,updatedAt:current.updatedAt.toISOString()};
  const now=new Date();
  const [saved]=current?await tx.update(placementTpoJobTypes).set({
   active:input.active,countsAsPlaced:fixed.countsAsPlaced,isBuiltin:true,updatedAt:now,
  }).where(and(eq(placementTpoJobTypes.id,current.id),eq(placementTpoJobTypes.collegeId,collegeId)))
   .returning():await tx.insert(placementTpoJobTypes).values({
    collegeId,label:fixed.label,active:input.active,countsAsPlaced:fixed.countsAsPlaced,isBuiltin:true,
   }).returning();
  if(!saved)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_builtin_job_type.visibility_changed",subjectType:"JOB_TYPE",
   subjectId:saved.id,summary:input.active?"TPO showed a built-in job type":"TPO hid a built-in job type",
   metadata:{label:fixed.label,active:input.active}});
  return {changed:true,updatedAt:saved.updatedAt.toISOString()};
 });
}

const placedSchema=z.object({jobTypeId:z.string().uuid(),countsAsPlaced:z.boolean(),
 expectedVersion:z.iso.datetime({offset:true})}).strict();
export async function setTpoJobTypeCountsAsPlaced(ctx:RequestContext,raw:unknown){
 const input=placedSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId}).from(colleges)
   .where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  // A stale request snapshot cannot authorize a write after role revocation.
  // The persisted actor SHARE locks remain held through the settings mutation.
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [current]=await tx.select().from(placementTpoJobTypes).where(and(
   eq(placementTpoJobTypes.collegeId,collegeId),eq(placementTpoJobTypes.id,input.jobTypeId)))
   .for("update").limit(1);
  if(!current)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  if(current.isBuiltin||isTpoBuiltinJobType(current.label))throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
  if(current.updatedAt.toISOString()!==input.expectedVersion)throw new TpoConfigError("TPO_SETTINGS_STALE");
  if(current.countsAsPlaced===input.countsAsPlaced)return {changed:false,updatedAt:current.updatedAt.toISOString()};
  const [saved]=await tx.update(placementTpoJobTypes).set({countsAsPlaced:input.countsAsPlaced,updatedAt:new Date()})
   .where(and(eq(placementTpoJobTypes.id,current.id),eq(placementTpoJobTypes.collegeId,collegeId),
    eq(placementTpoJobTypes.updatedAt,current.updatedAt))).returning();
  if(!saved)throw new TpoConfigError("TPO_SETTINGS_STALE");
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_job_type.placed_rule_changed",subjectType:"JOB_TYPE",
   subjectId:current.id,summary:"TPO changed a custom job type placement rule",
   metadata:{oldValue:current.countsAsPlaced,newValue:input.countsAsPlaced}});
  return {changed:true,updatedAt:saved.updatedAt.toISOString()};
 });
}
