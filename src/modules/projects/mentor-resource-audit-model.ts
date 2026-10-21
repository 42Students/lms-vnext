import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
/** Does not copy resource URLs, descriptions or learner identities into audit metadata. */
export function projectResourceAuditInput(
 action:"CREATED"|"UPDATED"|"ARCHIVED",
 scope:{projectId:string;collegeId:string;organizationId:string},
 resource:{id:string;title:string},
 nonce?:string,
 creatorRole?:"LEARNER"|"MENTOR"|"ADMIN",
){
 const eventType=action==="CREATED"?ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_CREATED:
  action==="UPDATED"?ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED:
  ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_ARCHIVED;
 const verb=action==="CREATED"?"added":action==="UPDATED"?"updated":"archived";
 return {
  eventType,collegeId:scope.collegeId,organizationId:scope.organizationId,
  subjectType:"project_resource",subjectId:resource.id,subjectLabel:resource.title,
  summary:"Project resource "+verb,
  metadata:{
   projectId:scope.projectId,resourceId:resource.id,
   ...(action==="CREATED"&&creatorRole ? {creatorRole} : {}),
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
