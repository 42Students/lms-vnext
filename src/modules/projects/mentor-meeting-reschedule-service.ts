import "server-only";
import {and,eq,gt,lt,ne,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectMeetings} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasActiveMembership,hasMembershipRole,type RequestContext}
  from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {mentorMeetingRescheduleParamsSchema,mentorMeetingRescheduleSchema,
  mentorMeetingCanReschedule} from "./mentor-meeting-reschedule-model";

/** Scheduled meeting time changes only; does not send or modify meeting links. */
export async function rescheduleMentorMeeting(context:RequestContext,rawParams:unknown,raw:unknown){
  const params=mentorMeetingRescheduleParamsSchema.parse(rawParams);
  const input=mentorMeetingRescheduleSchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR"))
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  const scope=await requireProjectReadAccess(context,params.projectId);
  if(scope.access!=="MENTOR"||!can(context,"projects.read",{
    organizationId:scope.organizationId,collegeId:scope.collegeId,
  }))throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  const start=new Date(input.startsAt),end=new Date(input.endsAt),
    expected=new Date(input.expectedUpdatedAt);
  if(start.getTime()<=Date.now())
    throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({status:projectInstances.status})
      .from(projectInstances).where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
    const [meeting]=await tx.select().from(projectMeetings)
      .where(and(eq(projectMeetings.id,params.meetingId),
        eq(projectMeetings.projectId,scope.project.id))).for("update").limit(1);
    if(!meeting)throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
    if(!project||!mentorMeetingCanReschedule(meeting.status,project.status))
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    // Stale version wins over the unchanged-time no-op check so a replayed
    // request reports a stale version rather than a generic invalid state.
    if(meeting.updatedAt.getTime()!==expected.getTime())
      throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    if(meeting.startsAt.getTime()===start.getTime()&&
      meeting.endsAt.getTime()===end.getTime())
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    const [conflict]=await tx.select({id:projectMeetings.id}).from(projectMeetings)
      .where(and(eq(projectMeetings.projectId,scope.project.id),
        ne(projectMeetings.id,meeting.id),eq(projectMeetings.status,"SCHEDULED"),
        lt(projectMeetings.startsAt,end),gt(projectMeetings.endsAt,start)))
      .limit(1);
    if(conflict)throw new ProjectsServiceError("PROJECT_MEETING_SCHEDULE_CONFLICT");
    const now=new Date(Math.max(Date.now(),meeting.updatedAt.getTime()+1));
    const [updated]=await tx.update(projectMeetings).set({
      startsAt:start,endsAt:end,timeZone:"Asia/Kolkata",updatedAt:now,
    }).where(and(eq(projectMeetings.id,meeting.id),
      eq(projectMeetings.projectId,scope.project.id),eq(projectMeetings.status,"SCHEDULED"),
      sql`date_trunc('milliseconds', ${projectMeetings.updatedAt}) = ${expected.toISOString()}::timestamptz`,
    )).returning();
    if(!updated)throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_RESCHEDULED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_meeting",subjectId:updated.id,subjectLabel:updated.title,
      summary:"Mentor rescheduled project meeting",
      metadata:{projectId:scope.project.id,meetingId:updated.id,
        previousStartsAt:meeting.startsAt.toISOString(),
        startsAt:updated.startsAt.toISOString(),timeZone:"Asia/Kolkata"},
      groupKey:"project:"+scope.project.id+":meetings",
    });
    return updated;
  });
}
