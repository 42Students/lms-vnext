import "server-only";
import {getProjectInstanceWorkspace} from "./instance-service";
import {getProjectReadiness} from "./readiness-service";
import {listProjectMeetings} from "./meeting-service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {hasActiveMembership,hasMembershipRole,type RequestContext}
  from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {mentorRiskReadinessQuerySchema,mentorRiskReadiness}
  from "./mentor-risk-readiness-model";

/** Evidence-only drill-down for a current, exact-project Mentor assignment. */
export async function getMentorRiskReadiness(context:RequestContext,raw:unknown){
  const query=mentorRiskReadinessQuerySchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
    !can(context,"projects.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  // Module-off is an authorization boundary, not merely an empty response.
  // Do not resolve a project UUID or return its title/status while disabled.
  const enabled=(await resolveOptionalModuleAccess(context)).projects.enabled;
  if(!enabled)return {
    enabled:false as const,query,projectTitle:"",projectStatus:"",
    counts:{blockedTasks:0,reviewTasks:0,pendingMeetings:0,
      scheduledPastDay:0,incompleteTasks:0,totalTasks:0,
      unshippedReleases:0,incompleteSprints:0},
    riskCount:0,readinessGapCount:0,latestSubmissionStatus:null,
    total:0,page:1,pageSize:20,totalPages:1,
    items:[] as ReturnType<typeof mentorRiskReadiness>["items"],
  };
  const scope=await requireProjectReadAccess(context,query.projectId);
  if(scope.access!=="MENTOR"||scope.collegeId!==membership.collegeId||
     !can(context,"projects.read",{
       collegeId:scope.collegeId,organizationId:scope.organizationId,
     }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const [workspace,readiness,meetings]=await Promise.all([
    getProjectInstanceWorkspace(context,scope.project.id),
    getProjectReadiness(context,scope.project.id),
    listProjectMeetings(context,scope.project.id),
  ]);
  const result=mentorRiskReadiness({
    projectId:scope.project.id,projectStatus:workspace.project.status,
    releases:workspace.releases.map(row=>({
      id:row.id,title:row.title,status:row.status,
    })),
    sprints:workspace.sprints.map(row=>({
      id:row.id,title:row.title,status:row.status,
    })),
    tasks:workspace.tasks.map(row=>({
      id:row.id,title:row.title,status:row.status,sprintId:row.sprintId,
      priority:row.priority,
    })),
    meetings:meetings.map(row=>({
      id:row.id,title:row.title,status:row.status,startsAt:row.startsAt,
    })),
    latestSubmissionStatus:readiness.finalSubmission.latest?.status??null,
    finalApproved:readiness.finalSubmission.approved,
    evaluationRecorded:readiness.evaluation.exists,
  },query);
  return {enabled:true as const,query,projectTitle:scope.project.title,...result};
}
