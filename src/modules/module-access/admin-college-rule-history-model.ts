import {z} from "zod";
export const collegePolicyHistoryQuery=z.strictObject({
 beforeOccurredAt:z.iso.datetime({offset:true}).optional(),
 beforeId:z.uuid().optional(),
}).refine(x=>Boolean(x.beforeOccurredAt)===Boolean(x.beforeId),{message:"Both cursor fields required"});
export type CollegePolicyHistoryCursor=z.infer<typeof collegePolicyHistoryQuery>;
type AuditRow={id:string;occurredAt:Date;actorName:string|null;metadata:Record<string,unknown>};
function state(value:unknown):string{
 if(value===null)return "Inherit";
 if(value&&typeof value==="object"&&"enabled" in value&&"locked" in value&&
  typeof value.enabled==="boolean"&&typeof value.locked==="boolean")
  return (value.enabled?"On":"Off")+(value.locked?" · Locked":"");
 return "Unknown";
}
export function safeCollegeRuleHistory(rows:readonly AuditRow[]){
 return rows.map(row=>({
  id:row.id,at:row.occurredAt,actorName:row.actorName||"Unknown actor",
  module:["projects","placements","electives"].includes(String(row.metadata.module))?String(row.metadata.module):"Optional module",
  change:state(row.metadata.before)+" → "+state(row.metadata.after),
 }));
}
export function collegePolicyHistoryHref(collegeId:string,cursor:{beforeOccurredAt:Date;beforeId:string}|null=null){
 const path="/admin/features/"+encodeURIComponent(collegeId)+"/history";
 if(!cursor)return path;
 return path+"?"+new URLSearchParams({beforeOccurredAt:cursor.beforeOccurredAt.toISOString(),beforeId:cursor.beforeId});
}


/** SA-tenants-modules-32 preserves the existing simple model used by legacy
 * callers, adding readable actor, scope and event type for the whole hierarchy. */
export function safeFullModuleHistory(rows:readonly (AuditRow & {
 eventType:string;subjectType:string;subjectId:string;
})[]){
 return rows.map(row=>{
  const module=["projects","placements","electives"].includes(String(row.metadata.module))?
   String(row.metadata.module):"Optional module";
  const category=row.eventType==="MODULE_ACCESS_BULK_SET"?"Student bulk access":
   row.eventType==="COLLEGE_FEATURE_TOGGLE"?"College feature toggle":"Access changed";
  const scopeLabel=["GLOBAL","ORGANIZATION","COLLEGE","DEPARTMENT","PROGRAM","COHORT","SECTION","MEMBERSHIP"]
   .includes(row.subjectType)?row.subjectType.toLowerCase():"scope";
  const size=typeof row.metadata.studentCount==="number"&&
   Number.isSafeInteger(row.metadata.studentCount)?row.metadata.studentCount:null;
  return {id:row.id,at:row.occurredAt,actorName:row.actorName||"Unknown actor",
   module,change:state(row.metadata.before)+" → "+state(row.metadata.after),
   category,scope:scopeLabel+" · "+row.subjectId,
   ...(size===null?{}:{studentCount:size})};
 });
}
