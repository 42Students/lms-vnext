import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
/** Does not copy resource URLs, descriptions or learner identities into audit metadata. */
export function projectResourceAuditInput(
 action:"CREATED"|"UPDATED"|"ARCHIVED",
 scope:{projectId:string;collegeId:string;organizationId:string},
 resource:{id:string;title:string},
 nonce?:string
){
 const eventType=action==="CREATED"?ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_CREATED:
  action==="UPDATED"?ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED:
  ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_ARCHIVED;
 const verb=action==="CREATED"?"added":action==="UPDATED"?"updated":"archived";
 return {
  eventType,collegeId:scope.collegeId,organizationId:scope.organizationId,
  subjectType:"project_resource",subjectId:resource.id,subjectLabel:resource.title,
  summary:"Project resource "+verb,
  metadata:{projectId:scope.projectId,resourceId:resource.id},
  groupKey:"project:"+scope.projectId,
  dedupeKey:"project-resource:"+resource.id+":"+action.toLowerCase()+(nonce?":"+nonce:""),
 };
}
