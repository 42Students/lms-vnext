import "server-only";
import {and,desc,eq,isNotNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectTasks,projectTaskSubmissions} from "@/db/schema";
import {can} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {mentorTaskFeedbackParamsSchema} from "./mentor-task-feedback-model";

/** Registered reviewer feedback is a single field on each submission version.
 * It is not a comments thread and does not support replies or new messages. */
export async function getMentorTaskFeedback(context:RequestContext,rawParams:unknown){
 const {projectId,taskId}=mentorTaskFeedbackParamsSchema.parse(rawParams);
 const membership=context.membership;
 if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR"))
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 // Module-off tenants must not reveal requested project existence.
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR"||!can(context,"projects.read",{
  collegeId:scope.collegeId,organizationId:scope.organizationId,
 }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const [task]=await getDb().select({id:projectTasks.id,title:projectTasks.title})
  .from(projectTasks)
  .where(and(eq(projectTasks.id,taskId),eq(projectTasks.projectId,scope.project.id)))
  .limit(1);
 if(!task)throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
 const feedback=await getDb().select({
  id:projectTaskSubmissions.id,
  version:projectTaskSubmissions.version,
  status:projectTaskSubmissions.status,
  feedback:projectTaskSubmissions.feedback,
  reviewedAt:projectTaskSubmissions.reviewedAt,
 }).from(projectTaskSubmissions)
  .where(and(
   eq(projectTaskSubmissions.projectId,scope.project.id),
   eq(projectTaskSubmissions.taskId,taskId),
   isNotNull(projectTaskSubmissions.feedback),
  ))
  .orderBy(desc(projectTaskSubmissions.version))
  .limit(50);
 return {projectId,task,feedback,hasCommentThread:false as const};
}
