import "server-only";
import {can,AuthorizationError} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext}
  from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {getProjectInstanceWorkspace} from "./instance-service";
import {mentorBoardReview,mentorBoardReviewQuerySchema} from "./mentor-board-review-model";

/** Read-only project task state, never fictitious assignee/workload fields. */
export async function getMentorBoardReview(context:RequestContext,raw:unknown){
  const query=mentorBoardReviewQuerySchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
    !can(context,"projects.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new AuthorizationError("projects.read");
  const enabled=(await resolveOptionalModuleAccess(context)).projects.enabled;
  if(!enabled)return {enabled:false as const,query,projectTitle:"",
    ...mentorBoardReview([],[],query)};
  const scope=await requireProjectReadAccess(context,query.projectId);
  if(scope.access!=="MENTOR"||scope.collegeId!==membership.collegeId||
    !can(context,"projects.read",{
      collegeId:scope.collegeId,organizationId:scope.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const view=await getProjectInstanceWorkspace(context,scope.project.id);
  return {enabled:true as const,query,projectTitle:view.project.title,
    ...mentorBoardReview(view.tasks,view.sprints,query)};
}
