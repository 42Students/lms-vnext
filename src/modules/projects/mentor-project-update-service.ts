import "server-only";
import {z} from "zod";
import {recordActivityEvent} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {ProjectsServiceError} from "./errors";

export const mentorProjectUpdateSchema=z.object({
  message:z.string().trim().min(1).max(1000),
}).strict();

/** User-authored project updates: explicit Mentor role + active assignment,
 * active project, optional module enabled and tenant-scoped persisted event. */
export async function postMentorProjectUpdate(
  context:RequestContext,projectId:string,raw:unknown,
){
  const data=mentorProjectUpdateSchema.parse(raw);
  const access=await requireProjectLifecycleMutationAccess(context,projectId);
  if(access.access!=="MENTOR"||access.project.status!=="ACTIVE")
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  const message=data.message;
  return recordActivityEvent(context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_UPDATE_POSTED,
    collegeId:access.collegeId,
    organizationId:access.organizationId,
    subjectType:"project",subjectId:access.project.id,
    subjectLabel:access.project.title,
    summary:message,
    metadata:{projectId:access.project.id,sourceTab:"activity",kind:"mentor_update"},
  });
}
