import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectMeetings} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasActiveMembership,hasMembershipRole,type RequestContext}
  from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {mentorMeetingNotesParamsSchema,mentorMeetingNotesWriteSchema,meetingNotesEditable}
  from "./mentor-meeting-notes-model";

async function getMentorMeetingNotesScope(context:RequestContext,projectId:string){
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR"))
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  // Resolve module entitlement before dereferencing the supplied project ID.
  // A disabled tenant must not reveal whether that project exists.
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  const scope=await requireProjectReadAccess(context,projectId);
  if(scope.access!=="MENTOR"||!can(context,"projects.read",{
    collegeId:scope.collegeId,organizationId:scope.organizationId,
  }))throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
  return scope;
}
export async function getMentorMeetingNotes(context:RequestContext,rawParams:unknown){
  const params=mentorMeetingNotesParamsSchema.parse(rawParams);
  const scope=await getMentorMeetingNotesScope(context,params.projectId);
  const [meeting]=await getDb().select({
    id:projectMeetings.id,title:projectMeetings.title,
    status:projectMeetings.status,startsAt:projectMeetings.startsAt,
    endsAt:projectMeetings.endsAt,timeZone:projectMeetings.timeZone,
    outcome:projectMeetings.outcome,updatedAt:projectMeetings.updatedAt,
  }).from(projectMeetings).where(and(eq(projectMeetings.id,params.meetingId),
    eq(projectMeetings.projectId,scope.project.id))).limit(1);
  if(!meeting)throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
  return {projectTitle:scope.project.title,projectStatus:scope.project.status,meeting};
}
export async function updateMentorMeetingNotes(context:RequestContext,
  rawParams:unknown,rawInput:unknown){
  const params=mentorMeetingNotesParamsSchema.parse(rawParams);
  const input=mentorMeetingNotesWriteSchema.parse(rawInput);
  const scope=await getMentorMeetingNotesScope(context,params.projectId);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({status:projectInstances.status})
      .from(projectInstances).where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
    await assertPersistedProjectMutationActor(tx,context,scope);
    const [meeting]=await tx.select().from(projectMeetings).where(and(
      eq(projectMeetings.id,params.meetingId),
      eq(projectMeetings.projectId,scope.project.id),
    )).for("update").limit(1);
    if(!meeting)throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
    // A stale tab must be identified before no-op or terminal-state checks;
    // otherwise a duplicate write misleadingly reports an unrelated state error.
    const expected=new Date(input.expectedUpdatedAt);
    if(meeting.updatedAt.getTime()!==expected.getTime())
      throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    if(!project||!meetingNotesEditable(project.status,meeting.status)||
      meeting.outcome?.trim()===input.outcome)
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    const now=new Date(Math.max(Date.now(),meeting.updatedAt.getTime()+1));
    const [updated]=await tx.update(projectMeetings).set({
      outcome:input.outcome,updatedAt:now,
    }).where(and(eq(projectMeetings.id,meeting.id),
      eq(projectMeetings.projectId,scope.project.id),
      eq(projectMeetings.status,"COMPLETED"),
      sql`date_trunc('milliseconds', ${projectMeetings.updatedAt}) = ${expected.toISOString()}::timestamptz`,
    )).returning();
    if(!updated)throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_NOTES_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_meeting",subjectId:updated.id,subjectLabel:updated.title,
      summary:"Project meeting outcome notes updated",
      metadata:{projectId:scope.project.id,meetingId:updated.id,
        hadNotesBefore:Boolean(meeting.outcome?.trim()),hasNotesAfter:true},
      groupKey:"project:"+scope.project.id+":meetings",
    });
    return updated;
  });
}
