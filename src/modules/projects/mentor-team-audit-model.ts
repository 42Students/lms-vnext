import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
/** Only opaque row IDs and registered roles, never learner contacts or membership IDs. */
export function projectTeamAuditInput(
 action:"ADDED"|"UPDATED"|"ENDED",
 scope:{projectId:string;collegeId:string;organizationId:string},
 member:{id:string;role:string},nonce?:string,
){
 const eventType=action==="ADDED"?ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_ADDED:
  action==="UPDATED"?ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_UPDATED:
  ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_ENDED;
 const summary=action==="ADDED"?"Project team member added":
  action==="UPDATED"?"Project team membership updated":"Project team membership ended";
 return {eventType,summary,collegeId:scope.collegeId,organizationId:scope.organizationId,
  subjectType:"project_member",subjectId:member.id,subjectLabel:"Project team membership",
  metadata:{projectId:scope.projectId,projectMemberId:member.id,role:member.role},
  groupKey:"project:"+scope.projectId,
  dedupeKey:"project-member:"+member.id+":"+action.toLowerCase()+(nonce?":"+nonce:""),
 };
}
