import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,colleges,placementJobs} from "@/db/schema";
import {placementTpoJobTypes} from "@/db/schema/tpo-configuration";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {tpoJobTypeNameSchema} from "./tpo-configuration-model";
import {TPO_BUILTIN_JOB_TYPES,isTpoBuiltinJobType} from "./tpo-builtin-job-types";

// The job-type column belongs to the schema/migration lane. Until that
// migration lands, block cross-drive writes instead of half-saving config.
const jobTypeColumnReady = sql`select exists (
 select 1 from information_schema.columns
 where table_schema = current_schema()
   and table_name = 'placement_jobs'
   and column_name = 'job_type_label'
) as ready`;
// Match the old LMS validation message while preserving the vNext schema's
// supported Unicode letters and punctuation. Never echo unescaped HTML.
const legacyLabelSchema=z.string().transform((raw,ctx)=>{
 const label=raw.trim().replace(/\s+/g," ");
 if(!tpoJobTypeNameSchema.safeParse(label).success){
  ctx.addIssue({code:"custom",message:'"'+label+'": a job type name is 2-40 letters, digits or simple punctuation'});
  return z.NEVER;
 }
 return label;
});
const createSchema=z.object({label:legacyLabelSchema,countsAsPlaced:z.boolean()}).strict();
export class TpoConfigError extends Error{
 constructor(public readonly code:"TPO_SETTINGS_PENDING"|"TPO_JOB_TYPE_EXISTS"|"TPO_SETTINGS_STALE"|"TPO_SETTINGS_NOT_FOUND"|"TPO_JOB_TYPE_LIMIT"|"TPO_JOB_TYPE_LAST_ACTIVE"|"TPO_JOB_TYPE_BUILTIN"|"TPO_JOB_TYPE_IN_USE"|"TPO_JOB_TYPE_INVALID_LIST",public readonly detail?:string){
  super(code);this.name="TpoConfigError";
 }
}
export async function createTpoJobType(context:RequestContext,raw:unknown){
 const input=createSchema.parse(raw),collegeId=await requireTpoBatchActor(context);
 if(isTpoBuiltinJobType(input.label))throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
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
  const [order]=await tx.select({
   next:sql<number>`(coalesce(max(${placementTpoJobTypes.sortOrder}),0)+1)::integer`,
  }).from(placementTpoJobTypes).where(eq(placementTpoJobTypes.collegeId,collegeId));
  const [created]=await tx.insert(placementTpoJobTypes).values({
   collegeId,label:input.label,active:true,countsAsPlaced:input.countsAsPlaced,isBuiltin:false,
   sortOrder:order?.next??1,
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
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  // A stale request snapshot cannot authorize a write after role revocation.
  // The persisted actor SHARE locks remain held through the settings mutation.
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [current]=await tx.select().from(placementTpoJobTypes).where(and(
   eq(placementTpoJobTypes.id,input.jobTypeId),eq(placementTpoJobTypes.collegeId,collegeId))).limit(1);
  if(!current)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  if(current.isBuiltin||isTpoBuiltinJobType(current.label))throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
  // A successful save retried with the old token is a harmless no-op.
  if(current.active===input.active)return {changed:false,updatedAt:current.updatedAt.toISOString()};
  if(current.updatedAt.toISOString()!==input.expectedVersion)throw new TpoConfigError("TPO_SETTINGS_STALE");
  if(!input.active){
   const all=await tx.select({label:placementTpoJobTypes.label,active:placementTpoJobTypes.active})
    .from(placementTpoJobTypes).where(eq(placementTpoJobTypes.collegeId,collegeId));
   const activeCustom=all.filter(row=>!isTpoBuiltinJobType(row.label)&&row.active).length;
   const activeFixed=TPO_BUILTIN_JOB_TYPES.filter(fixed=>
    all.find(row=>row.label===fixed.label)?.active??true).length;
   if(activeCustom+activeFixed<=1)throw new TpoConfigError("TPO_JOB_TYPE_LAST_ACTIVE");
  }
  const [updated]=await tx.update(placementTpoJobTypes).set({active:input.active,
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoJobTypes.updatedAt}) + interval '1 millisecond')`,
  })
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

const renameSchema=z.object({jobTypeId:z.string().uuid(),label:legacyLabelSchema,
 expectedVersion:z.iso.datetime({offset:true})}).strict();
export async function renameTpoJobType(ctx:RequestContext,raw:unknown){
 const input=renameSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 if(isTpoBuiltinJobType(input.label))throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status}).from(colleges)
   .where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
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
  if(current.label===input.label)return {changed:false,updatedAt:current.updatedAt.toISOString()};
  if(current.updatedAt.toISOString()!==input.expectedVersion)throw new TpoConfigError("TPO_SETTINGS_STALE");
  const [existing]=await tx.select({id:placementTpoJobTypes.id}).from(placementTpoJobTypes)
   .where(and(eq(placementTpoJobTypes.collegeId,collegeId),
    sql`lower(${placementTpoJobTypes.label}) = lower(${input.label}::text)`)).limit(1);
  if(existing&&existing.id!==current.id)throw new TpoConfigError("TPO_JOB_TYPE_EXISTS");
  const jobTypeColumn=await tx.execute<{ready:boolean}>(jobTypeColumnReady);
  if(jobTypeColumn.rows[0]?.ready!==true)throw new TpoConfigError("TPO_SETTINGS_PENDING");
  const [updated]=await tx.update(placementTpoJobTypes).set({label:input.label,
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoJobTypes.updatedAt}) + interval '1 millisecond')`})
   .where(and(eq(placementTpoJobTypes.id,current.id),eq(placementTpoJobTypes.collegeId,collegeId),
    eq(placementTpoJobTypes.updatedAt,current.updatedAt))).returning();
  if(!updated)throw new TpoConfigError("TPO_SETTINGS_STALE");
  // Atomic tenant-scoped cascade, including historical/archived drives.
  // Bump job CAS versions so another editor cannot overwrite a renamed type.
  await tx.execute(sql`update placement_jobs
   set job_type_label = ${updated.label},
       version = version + 1,
       updated_at = greatest(clock_timestamp(), date_trunc('milliseconds', updated_at) + interval '1 millisecond')
   where college_id = ${collegeId} and lower(job_type_label) = lower(${current.label})`);
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
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status}).from(colleges)
   .where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  // A stale request snapshot cannot authorize a write after role revocation.
  // The persisted actor SHARE locks remain held through the settings mutation.
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const rows=await tx.select().from(placementTpoJobTypes)
   .where(eq(placementTpoJobTypes.collegeId,collegeId));
  const current=rows.find(row=>row.label.toLocaleLowerCase("en-IN")===fixed.label.toLocaleLowerCase("en-IN"));
  // Persisted built-in overrides are safe to retry without another audit.
  if(current?.active===input.active&&current.isBuiltin)return {changed:false,updatedAt:current.updatedAt.toISOString()};
  if(!current&&input.active&&input.expectedVersion==="none")return {changed:false,updatedAt:"none"};
  if((current?.updatedAt.toISOString()??"none")!==input.expectedVersion)
   throw new TpoConfigError("TPO_SETTINGS_STALE");
  if(!input.active){
   const builtinActive=TPO_BUILTIN_JOB_TYPES.filter(item=>
    rows.find(row=>row.label===item.label)?.active??true).length;
   const customActive=rows.filter(row=>!isTpoBuiltinJobType(row.label)&&row.active).length;
   const targetActive=current?.active??true;
   if(targetActive&&builtinActive+customActive<=1)throw new TpoConfigError("TPO_JOB_TYPE_LAST_ACTIVE");
  }
  const [saved]=current?await tx.update(placementTpoJobTypes).set({
   active:input.active,countsAsPlaced:fixed.countsAsPlaced,isBuiltin:true,
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoJobTypes.updatedAt}) + interval '1 millisecond')`,
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
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status}).from(colleges)
   .where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
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
  if(current.countsAsPlaced===input.countsAsPlaced)return {changed:false,updatedAt:current.updatedAt.toISOString()};
  if(current.updatedAt.toISOString()!==input.expectedVersion)throw new TpoConfigError("TPO_SETTINGS_STALE");
  const jobTypeColumn=await tx.execute<{ready:boolean}>(jobTypeColumnReady);
  if(jobTypeColumn.rows[0]?.ready!==true)throw new TpoConfigError("TPO_SETTINGS_PENDING");
  const [saved]=await tx.update(placementTpoJobTypes).set({countsAsPlaced:input.countsAsPlaced,
   updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoJobTypes.updatedAt}) + interval '1 millisecond')`,
  })
   .where(and(eq(placementTpoJobTypes.id,current.id),eq(placementTpoJobTypes.collegeId,collegeId),
    eq(placementTpoJobTypes.updatedAt,current.updatedAt))).returning();
  if(!saved)throw new TpoConfigError("TPO_SETTINGS_STALE");
  // Snapshot the new policy on all linked drives in the same transaction.
  await tx.execute(sql`update placement_jobs
   set counts_as_placed = ${input.countsAsPlaced},
       version = version + 1,
       updated_at = greatest(clock_timestamp(), date_trunc('milliseconds', updated_at) + interval '1 millisecond')
   where college_id = ${collegeId} and lower(job_type_label) = lower(${current.label})`);
  await tx.insert(activityEvents).values({organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"placements.tpo_job_type.placed_rule_changed",subjectType:"JOB_TYPE",
   subjectId:current.id,summary:"TPO changed a custom job type placement rule",
   metadata:{oldValue:current.countsAsPlaced,newValue:input.countsAsPlaced}});
  return {changed:true,updatedAt:saved.updatedAt.toISOString()};
 });
}

const removeSchema=z.object({jobTypeId:z.string().uuid(),
 expectedVersion:z.iso.datetime({offset:true})}).strict();
/** Delete only unused college custom types; existing drives always retain their historical label. */
export async function removeTpoJobType(ctx:RequestContext,raw:unknown){
 const input=removeSchema.parse(raw),collegeId=await requireTpoBatchActor(ctx);
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const [current]=await tx.select().from(placementTpoJobTypes)
   .where(and(eq(placementTpoJobTypes.id,input.jobTypeId),eq(placementTpoJobTypes.collegeId,collegeId)))
   .for("update").limit(1);
  if(!current)throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  if(current.isBuiltin||isTpoBuiltinJobType(current.label))throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
  if(current.updatedAt.toISOString()!==input.expectedVersion)throw new TpoConfigError("TPO_SETTINGS_STALE");
  const jobTypeColumn=await tx.execute<{ready:boolean}>(jobTypeColumnReady);
  if(jobTypeColumn.rows[0]?.ready!==true)throw new TpoConfigError("TPO_SETTINGS_PENDING");
  const [usage]=await tx.select({n:sql<number>`count(*)::integer`}).from(placementJobs)
   .where(and(eq(placementJobs.collegeId,collegeId),
    sql`lower(job_type_label) = lower(${current.label})`));
  // Even archived drives remain historical references and block deletion.
  if((usage?.n??0)>0)throw new TpoConfigError("TPO_JOB_TYPE_IN_USE");
  await tx.delete(placementTpoJobTypes).where(and(eq(placementTpoJobTypes.id,current.id),
   eq(placementTpoJobTypes.collegeId,collegeId)));
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:ctx.user.id,
   actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",eventType:"placements.tpo_job_type.removed",
   subjectType:"JOB_TYPE",subjectId:current.id,summary:"TPO removed an unused custom job type",
   metadata:{label:current.label},
  });
  return {changed:true};
 });
}

const bulkJobTypeSchema=z.array(z.object({
 id:z.string().uuid().nullable(),
 label:legacyLabelSchema,
 isBuiltin:z.boolean(),
 active:z.boolean(),
 countsAsPlaced:z.boolean(),
 expectedVersion:z.union([z.literal("none"),z.iso.datetime({offset:true})]),
}).strict()).min(5).max(35);

/** Settings parity: save all visibility/placed/name/add/remove edits in one tenant-scoped transaction. */
export async function saveTpoJobTypes(ctx:RequestContext,raw:unknown){
 const parsed=bulkJobTypeSchema.safeParse(raw);
 if(!parsed.success)throw new TpoConfigError("TPO_JOB_TYPE_INVALID_LIST","Send the list of job types");
 const input=parsed.data,collegeId=await requireTpoBatchActor(ctx);
 if(!await placementTableExists("placement_tpo_job_types"))throw new TpoConfigError("TPO_SETTINGS_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college||college.status!=="ACTIVE")throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  const names=new Set<string>(),seenIds=new Set<string>();
  let customCount=0;
  for(const item of input){
   const key=item.label.toLowerCase();
   if(names.has(key))throw new TpoConfigError("TPO_JOB_TYPE_EXISTS");
   names.add(key);
   const fixed=TPO_BUILTIN_JOB_TYPES.find(row=>row.label.toLowerCase()===key);
   if(item.isBuiltin){
    if(!fixed || item.label !== fixed.label || item.countsAsPlaced !== fixed.countsAsPlaced)
     throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
   }else{
    if(fixed)throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
    customCount++;
   }
   if(item.id){
    if(seenIds.has(item.id))throw new TpoConfigError("TPO_JOB_TYPE_EXISTS");
    seenIds.add(item.id);
   }
  }
  if(TPO_BUILTIN_JOB_TYPES.some(row=>!input.some(item=>item.isBuiltin&&item.label===row.label)))
   throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
  if(customCount>30)throw new TpoConfigError("TPO_JOB_TYPE_LIMIT");
  if(!input.some(item=>item.active))throw new TpoConfigError("TPO_JOB_TYPE_LAST_ACTIVE");
  const jobTypeColumn=await tx.execute<{ready:boolean}>(jobTypeColumnReady);
  if(jobTypeColumn.rows[0]?.ready!==true)throw new TpoConfigError("TPO_SETTINGS_PENDING");
  const existing=await tx.select().from(placementTpoJobTypes)
   .where(eq(placementTpoJobTypes.collegeId,collegeId)).for("update");
  const byId=new Map(existing.map(item=>[item.id,item]));
  const usage=await tx.select({
   label:sql<string>`lower(job_type_label)`,
   count:sql<number>`count(*)::integer`,
  }).from(placementJobs).where(eq(placementJobs.collegeId,collegeId))
   .groupBy(sql`lower(job_type_label)`);
  const counts=new Map(usage.map(item=>[item.label,item.count]));
  // Remove absent custom types before renames; only unused labels may be removed.
  for(const old of existing){
   if(old.isBuiltin||isTpoBuiltinJobType(old.label)||seenIds.has(old.id))continue;
   const oldDrives=counts.get(old.label.toLowerCase())??0;
   if(oldDrives>0)throw new TpoConfigError("TPO_JOB_TYPE_IN_USE",
    '"'+old.label+'" is used by '+oldDrives+' drive'+(oldDrives===1?'':'s')+
    ': switch it off instead of deleting it');
   await tx.delete(placementTpoJobTypes).where(and(
    eq(placementTpoJobTypes.id,old.id),eq(placementTpoJobTypes.collegeId,collegeId)));
  }
  for(let index=0;index<input.length;index++){
   const item=input[index];
   if(item.isBuiltin){
    const fixed=TPO_BUILTIN_JOB_TYPES.find(row=>row.label===item.label)!;
    const old=existing.find(row=>row.label.toLowerCase()===fixed.label.toLowerCase());
    if((old?.updatedAt.toISOString()??"none")!==item.expectedVersion)
     throw new TpoConfigError("TPO_SETTINGS_STALE");
    if(old){
     if(!old.isBuiltin)throw new TpoConfigError("TPO_JOB_TYPE_BUILTIN");
     if(old.active!==item.active)await tx.update(placementTpoJobTypes).set({
      active:item.active,sortOrder:index,
      updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoJobTypes.updatedAt}) + interval '1 millisecond')`,
     }).where(and(eq(placementTpoJobTypes.id,old.id),eq(placementTpoJobTypes.collegeId,collegeId)));
    }else if(!item.active){
     await tx.insert(placementTpoJobTypes).values({collegeId,label:fixed.label,isBuiltin:true,
      active:false,countsAsPlaced:fixed.countsAsPlaced,sortOrder:index});
    }
    continue;
   }
   const old=item.id?byId.get(item.id):null;
   if(item.id&&(!old||old.isBuiltin||isTpoBuiltinJobType(old.label)))
    throw new TpoConfigError("TPO_SETTINGS_NOT_FOUND");
   if((old?.updatedAt.toISOString()??"none")!==item.expectedVersion)
    throw new TpoConfigError("TPO_SETTINGS_STALE");
   if(old){
    if(old.label!==item.label||old.countsAsPlaced!==item.countsAsPlaced){
     await tx.execute(sql`update placement_jobs
      set job_type_label = ${item.label},
          counts_as_placed = ${item.countsAsPlaced},
          version = version + 1,
          updated_at = greatest(clock_timestamp(), date_trunc('milliseconds', updated_at) + interval '1 millisecond')
      where college_id = ${collegeId} and lower(job_type_label) = lower(${old.label})`);
    }
    await tx.update(placementTpoJobTypes).set({
     label:item.label,active:item.active,countsAsPlaced:item.countsAsPlaced,sortOrder:index,
     updatedAt:sql`greatest(clock_timestamp(),date_trunc('milliseconds',${placementTpoJobTypes.updatedAt}) + interval '1 millisecond')`,
    }).where(and(eq(placementTpoJobTypes.id,old.id),eq(placementTpoJobTypes.collegeId,collegeId)));
   }else{
    await tx.insert(placementTpoJobTypes).values({
     collegeId,label:item.label,isBuiltin:false,active:item.active,
     countsAsPlaced:item.countsAsPlaced,sortOrder:index,
    });
   }
  }
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,actorUserId:ctx.user.id,
   actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",eventType:"placements.tpo_job_types.updated",
   subjectType:"COLLEGE",subjectId:collegeId,
   summary:"JOB_TYPES_UPDATED",
   metadata:{customCount,hiddenCount:input.filter(item=>!item.active).length,
    changedLabels:input.map(item=>item.label)},
  });
  return {saved:true};
 });
}
