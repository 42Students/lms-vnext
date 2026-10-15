import "server-only";
import {hasActiveMembership,hasMembershipRole,type RequestContext}
  from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {ProjectsServiceError} from "./errors";
import {listMyProjectInstances} from "./member-service";
import {listMyMentorProjectAttention} from "./mentor-attention-service";
import {getMentorProjectWorkCounts} from "./mentor-project-work-service";
import {mentorReportsQuerySchema,mentorReportsOverview} from "./mentor-reports-model";

/** The report is a projection over persisted currently assigned Mentor projects. */
export async function getMentorReports(context:RequestContext,raw:unknown){
  const query=mentorReportsQuerySchema.parse(raw);
  const member=context.membership;
  if(!member||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
    !can(context,"projects.read",{
      collegeId:member.collegeId,organizationId:member.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const enabled=(await resolveOptionalModuleAccess(context)).projects.enabled;
  if(!enabled)return {enabled:false as const,query,
    ...mentorReportsOverview([],[],query)};
  const [assigned,attention,taskCounts]=await Promise.all([
    listMyProjectInstances(context),listMyMentorProjectAttention(context),
    (query.taskCoverage!=="ALL"||query.order==="TASK_PROGRESS")
      ?getMentorProjectWorkCounts(context):Promise.resolve(new Map()),
  ]);
  const projects=assigned.filter(row=>row.memberRole==="MENTOR")
    .map(row=>({id:row.project.id,title:row.project.title,
      status:row.project.status,isPrimaryMentor:row.isPrimaryMentor,
      updatedAt:row.project.updatedAt}));
  return {enabled:true as const,query,
    ...mentorReportsOverview(projects,attention,query,taskCounts)};
}
