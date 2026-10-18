import "server-only";
import {can} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext}
  from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {getProjectInstanceWorkspace} from "./instance-service";
import {ProjectsServiceError} from "./errors";
import {mentorTimelineQuerySchema,mentorProjectTimeline} from "./mentor-project-timeline-model";

/** Ordered migrated release/sprint progression, not a schedule or forecast. */
export async function getMentorProjectTimeline(context:RequestContext,raw:unknown){
  const query=mentorTimelineQuerySchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
    !can(context,"projects.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const enabled=(await resolveOptionalModuleAccess(context)).projects.enabled;
  if(!enabled){
    return {enabled:false as const,projectTitle:"",projectStatus:"",
      query,...mentorProjectTimeline([],[],[],query)};
  }
  const scope=await requireProjectReadAccess(context,query.projectId);
  if(scope.access!=="MENTOR"||scope.collegeId!==membership.collegeId||
    !can(context,"projects.read",{
      collegeId:scope.collegeId,organizationId:scope.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const workspace=await getProjectInstanceWorkspace(context,scope.project.id);
  return {
    enabled:true as const,projectTitle:workspace.project.title,
    projectStatus:workspace.project.status,query,
    ...mentorProjectTimeline(workspace.releases,workspace.sprints,workspace.tasks,query),
  };
}
