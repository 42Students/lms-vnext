import "server-only";
import {and,desc,eq} from "drizzle-orm";
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
export async function getProjectResourceHistory(context:RequestContext,projectId:string){
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const scope=await requireProjectLifecycleAccess(context,projectId);
 if(isSuperAdmin(context) && context.adminScope?.collegeId!==scope.collegeId)
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 try{
  const entries=await getDb().select({
   id:activityEvents.id,resourceId:activityEvents.subjectId,
   summary:activityEvents.summary,eventType:activityEvents.eventType,
   occurredAt:activityEvents.occurredAt,
   actorUserId:activityEvents.actorUserId,
   actorRoleSnapshot:activityEvents.actorRoleSnapshot,
   metadata:activityEvents.metadata,
  }).from(activityEvents).where(and(
   eq(activityEvents.collegeId,scope.collegeId),
   eq(activityEvents.organizationId,scope.organizationId),
   eq(activityEvents.module,"PROJECTS"),
   eq(activityEvents.subjectType,"project_resource"),
   eq(activityEvents.groupKey,"project:"+scope.project.id),
  )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(201);
  return {rows:entries.slice(0,200).map(({metadata,...row})=>{
   const meta=metadata??{};
   const order=meta.resourceOrder;
   const key=meta.resourceKey;
   const type=meta.actionType;
   const changed=meta.changedFields;
   return {
    ...row,occurredAt:row.occurredAt.toISOString(),
    resourceKey:typeof key==="string"&&key.length<=120?key:row.resourceId,
    actionType:typeof type==="string"&&["CREATE","UPDATE","DELETE","UPSERT"].includes(type)
     ?type:row.eventType,
    resourceOrder:typeof order==="number"&&Number.isSafeInteger(order)&&order>=0?order:null,
    beforeJson:safeSnapshot(meta.beforeJson),
    afterJson:safeSnapshot(meta.afterJson),
    changedFields:Array.isArray(changed)?changed.filter((field):field is string=>
      typeof field==="string"&&resourceSnapshotKeys.has(field)):[],
   };
  }),hasMore:entries.length>200};
 }catch{
  throw new ProjectResourceHistoryUnavailable();
 }
}
