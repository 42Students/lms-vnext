import "server-only";
import {and,count,desc,eq,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {ProjectsServiceError} from "./errors";
import {requireProjectLifecycleAccess} from "./access";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";

/** Resource audit is immutable event metadata, not a full database-row dump.
 * Only safe scalar resource fields are projected to an authorized staff UI.
 * Historic events without these fields retain a stable ID/action fallback. */
const resourceSnapshotKeys=new Set([
 "title","sequence","required","visibility","resourceType",
 "status","pinned","legacyResourceKind","url","description","accessNotes",
]);
const suppressedText=new Set(["url","description","accessNotes"]);
function safeSnapshot(value:unknown):Record<string,string|number|boolean|null>|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const result:Record<string,string|number|boolean|null>={};
 for(const [key,item] of Object.entries(value)){
  if(!resourceSnapshotKeys.has(key))continue;
  if(suppressedText.has(key)){
   result[key]=item===null?null:"[redacted]";
  }else if(item===null||typeof item==="number"&&Number.isFinite(item)||
    typeof item==="boolean"){
   result[key]=item;
  }else if(typeof item==="string"){
   result[key]=item.replace(/(?:https?:\/\/|s3:\/\/|r2:\/\/)[^\s]+/gi,"[private reference]").slice(0,240);
  }
 }
 return result;
}

export class ProjectResourceHistoryUnavailable extends Error{
 constructor(){super("RESOURCE_AUDIT_UNAVAILABLE");this.name="ProjectResourceHistoryUnavailable";}
}

/** Authorized, college-scoped immutable resource events. Live resources and
 * history are distinct reads; a Super Admin must have selected the same
 * college as the workspace, and all other roles use existing lifecycle scope.
 * 201 rows signal more history, never imply a truncated list is complete. */
export async function getProjectResourceHistory(
 context:RequestContext,projectId:string,
 raw:unknown={},
){
 const requested=z.strictObject({
  page:z.coerce.number().int().min(1).max(10000).default(1),
  pageSize:z.coerce.number().int().min(1).max(200).default(200),
  resourceKey:z.string().trim().min(1).max(120).optional(),
 }).parse(raw);
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const scope=await requireProjectLifecycleAccess(context,projectId);
 if(isSuperAdmin(context) && context.adminScope?.collegeId!==scope.collegeId)
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 try{
  const db=getDb();
  const filters=and(
   eq(activityEvents.collegeId,scope.collegeId),
   eq(activityEvents.organizationId,scope.organizationId),
   eq(activityEvents.module,"PROJECTS"),
   eq(activityEvents.subjectType,"project_resource"),
   or(eq(activityEvents.groupKey,"project:"+scope.project.id),
      eq(activityEvents.groupKey,"project:"+scope.project.id+":resources")),
   requested.resourceKey?or(
    sql`${activityEvents.subjectId}::text = ${requested.resourceKey}`,
    sql`${activityEvents.metadata} ->> 'resourceKey' = ${requested.resourceKey}`,
   ):undefined,
  );
  const [summary]=await db.select({total:count()}).from(activityEvents).where(filters);
  const total=Number(summary?.total??0);
  const pageCount=Math.max(1,Math.ceil(total/requested.pageSize));
  const page=Math.min(requested.page,pageCount);
  const entries=await db.select({
   id:activityEvents.id,resourceId:activityEvents.subjectId,
   summary:activityEvents.summary,eventType:activityEvents.eventType,
   occurredAt:activityEvents.occurredAt,
   actorUserId:activityEvents.actorUserId,
   actorRoleSnapshot:activityEvents.actorRoleSnapshot,
   metadata:activityEvents.metadata,
  }).from(activityEvents).where(filters)
   .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id))
   .limit(requested.pageSize).offset((page-1)*requested.pageSize);
  return {rows:entries.map(({metadata,...row})=>{
   const meta=metadata??{};
   const order=meta["resourceOrder"];
   const key=meta["resourceKey"];
   const type=meta["actionType"];
   const changed=meta["changedFields"];
   const previousSequence=meta["previousSequence"];
   const nextSequence=meta["nextSequence"];
   const reordered=Number.isSafeInteger(previousSequence)&&
    Number.isSafeInteger(nextSequence);
   return {
    ...row,occurredAt:row.occurredAt.toISOString(),
    resourceKey:typeof key==="string"&&key.length<=120?key:row.resourceId,
    actionType:typeof type==="string"&&["CREATE","UPDATE","DELETE","UPSERT"].includes(type)
     ?type:row.eventType,
    resourceOrder:typeof order==="number"&&Number.isSafeInteger(order)&&order>=0
     ?order:typeof nextSequence==="number"&&Number.isSafeInteger(nextSequence)&&nextSequence>=0
      ?nextSequence:null,
    beforeJson:safeSnapshot(meta["beforeJson"])??(reordered?{sequence:previousSequence as number}:null),
    afterJson:safeSnapshot(meta["afterJson"])??(reordered?{sequence:nextSequence as number}:null),
    changedFields:Array.isArray(changed)?changed.filter((field):field is string=>
      typeof field==="string"&&resourceSnapshotKeys.has(field)):(reordered?["sequence"]:[]),
   };
  }),total,page,pageSize:requested.pageSize,pageCount,hasMore:page<pageCount};
 }catch{
  throw new ProjectResourceHistoryUnavailable();
 }
}
