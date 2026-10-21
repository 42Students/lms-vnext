import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
/** Audit snapshots include durable, non-sensitive resource fields only. Private
 * URLs, upload keys, descriptions, access notes and member identifiers never
 * enter the activity stream, even if passed in a full DB result row.
 */
type ResourceAuditSnapshotInput={
 id?:string;title?:string;sequence?:number;resourceOrder?:number|null;
 required?:boolean;visibility?:string;resourceType?:string;
 status?:string;pinned?:boolean;legacyResourceKind?:string|null;
 url?:string|null;description?:string|null;accessNotes?:string|null;
};
export function redactedProjectResourceSnapshot(resource:ResourceAuditSnapshotInput|null|undefined){
 if(!resource)return null;
 const cleanTitle=(resource.title??"").replace(/(?:https?:\/\/|s3:\/\/|r2:\/\/)[^\s]+/gi,"[private reference]").slice(0,240);
 return {
  title:cleanTitle,
  sequence:resource.sequence??resource.resourceOrder??null,
  required:resource.required??null,
  visibility:resource.visibility??null,
  resourceType:resource.resourceType??null,
  status:resource.status??null,
  pinned:resource.pinned??null,
  legacyResourceKind:resource.legacyResourceKind??null,
  url:resource.url?"[redacted private resource URL]":null,
  description:resource.description?"[redacted resource description]":null,
  accessNotes:resource.accessNotes?"[redacted access notes]":null,
 };
}
export function projectResourceAuditDelta(before:ResourceAuditSnapshotInput|null|undefined,
 after:ResourceAuditSnapshotInput|null|undefined){
 const beforeJson=redactedProjectResourceSnapshot(before);
 const afterJson=redactedProjectResourceSnapshot(after);
 const beforeFields:Record<string,unknown>=beforeJson??{},afterFields:Record<string,unknown>=afterJson??{};
 const keys=new Set([...Object.keys(beforeFields),...Object.keys(afterFields)]);
 const changedFields=[...keys].filter(field=>
  beforeFields[field]!==afterFields[field]);
 return {beforeJson,afterJson,changedFields};
}
/** Does not copy resource URLs, descriptions or learner identities into audit metadata. */
export function projectResourceAuditInput(
 action:"CREATED"|"UPDATED"|"ARCHIVED",
 scope:{projectId:string;collegeId:string;organizationId:string},
 resource:{id:string;title:string;resourceOrder?:number|null},
 nonce?:string,
 creatorRole?:"LEARNER"|"MENTOR"|"ADMIN",
 snapshots?:{before?:ResourceAuditSnapshotInput|null;after?:ResourceAuditSnapshotInput|null},
){
 const eventType=action==="CREATED"?ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_CREATED:
  action==="UPDATED"?ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED:
  ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_ARCHIVED;
 const verb=action==="CREATED"?"added":action==="UPDATED"?"updated":"archived";
 return {
  eventType,collegeId:scope.collegeId,organizationId:scope.organizationId,
  subjectType:"project_resource",subjectId:resource.id,
  subjectLabel:legacyProjectResourceAuditLabel(resource.title),
  summary:"Project resource "+verb,
  metadata:{
   projectId:scope.projectId,resourceId:resource.id,
   ...projectResourceAuditDelta(snapshots?.before??null,snapshots?.after??resource),
   ...(resource.resourceOrder!==undefined&&resource.resourceOrder!==null&&
      Number.isSafeInteger(resource.resourceOrder)&&resource.resourceOrder>=0
    ? {resourceOrder:resource.resourceOrder}:{}) ,
   ...(action==="CREATED"&&creatorRole ? {
     creatorRole,originalActorType:creatorRole,
   } : {}),
  },
  groupKey:"project:"+scope.projectId,
  dedupeKey:"project-resource:"+resource.id+":"+action.toLowerCase()+(nonce?":"+nonce:""),
 };
}

/** A matching numeric or UUID actor ID alone cannot establish ownership.
 * Unknown historic creator roles are not eligible for learner self-edits.
 * Mentor/admin overrides must be authorized separately, not by this helper.
 */
export function isProjectResourceOriginalCreator(
 creator:{userId:string;role:"LEARNER"|"MENTOR"|"ADMIN"}|null,
 actor:{userId:string;role:"LEARNER"|"MENTOR"|"ADMIN"},
):boolean {
 return creator!==null && creator.userId===actor.userId && creator.role===actor.role;
}

/** Legacy resource keys drop the prefix and turn hyphens into words. */
export function legacyProjectResourceAuditLabel(key:string|null|undefined):string{
 const label=(key??"").replace(/^resource[-_]/i,"").replace(/[-_]+/g," ").trim();
 return label||"—";
}
export const LEGACY_PROJECT_RESOURCE_ACTIONS = {
 UPSERT:"Saved",CREATE:"Added",UPDATE:"Edited",DELETE:"Removed",
 CREATED:"Added",UPDATED:"Edited",ARCHIVED:"Removed",
} as const;
export function legacyProjectResourceAuditTag(action:keyof typeof LEGACY_PROJECT_RESOURCE_ACTIONS){
 const label=LEGACY_PROJECT_RESOURCE_ACTIONS[action];
 const tone=label==="Added"?"success":label==="Edited"?"warning":label==="Removed"?"error":"info";
 return {label,tone};
}
