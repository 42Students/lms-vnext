import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectMeetings,projectInstances} from "@/db/schema";
import {type RequestContext,hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {requireProjectReadAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {ProjectsServiceError} from "./errors";
import {projectMeetingIdSchema} from "./validation";
import {mentorMeetingDecisionSchema,mentorMeetingDecisionStatus} from "./mentor-meeting-decision-model";
import {notifyActiveProjectMembers} from "./project-notification-service";

/** Mentor-only, locked and audited alternative to legacy non-versioned transitions. */
export async function decideMentorProjectMeeting(context:RequestContext,rawProjectId:string,
 rawMeetingId:string,raw:unknown){
 const input=mentorMeetingDecisionSchema.parse(raw);
 // Never resolve a project ID on a tenant where Projects is disabled.
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
  throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
 const scope=await requireProjectReadAccess(context,rawProjectId);
 const member=context.membership;
 if(scope.access!=="MENTOR"||!member||!hasActiveMembership(context)||
  !hasMembershipRole(context,"MENTOR")||!can(context,"projects.read",{
   collegeId:scope.collegeId,organizationId:scope.organizationId,
  }))throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
 const meetingId=projectMeetingIdSchema.parse(rawMeetingId);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),
    eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
  if(!project||project.status==="ARCHIVED"||project.status==="COMPLETED")
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  await assertPersistedProjectMutationActor(tx,context,scope);
  const [current]=await tx.select().from(projectMeetings).where(and(
   eq(projectMeetings.id,meetingId),eq(projectMeetings.projectId,scope.project.id),
  )).for("update").limit(1);
  if(!current)throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
  // Duplicate/stale-tab decisions should report the authoritative version
  // mismatch instead of hiding concurrency behind a terminal-state message.
  const expected=new Date(input.expectedUpdatedAt);
  if(current.updatedAt.getTime()!==expected.getTime())
   throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  if(!mentorMeetingDecisionStatus(input.action,current.status))
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  const now=new Date(Math.max(Date.now(),current.updatedAt.getTime()+1));
  const [updated]=await tx.update(projectMeetings).set(input.action==="COMPLETE"?{
    status:"COMPLETED",outcome:input.outcome??current.outcome??null,cancellationNote:null,updatedAt:now,
   }:{
    status:"CANCELLED",cancellationNote:input.note??null,updatedAt:now,
   }).where(and(eq(projectMeetings.id,current.id),
    eq(projectMeetings.projectId,scope.project.id),
    sql`date_trunc('milliseconds', ${projectMeetings.updatedAt}) = ${expected.toISOString()}::timestamptz`,
   )).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  // Record the revision even if it was an unpublished mentor draft; only
  // outward learner notifications are suppressed for private drafts.
  const event=await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project_meeting",subjectId:updated.id,
   summary:input.action==="COMPLETE"?"Project meeting completed":"Project meeting cancelled",
   metadata:{projectId:scope.project.id,meetingId:updated.id,
    actorMembershipId:member.id,action:input.action,
    before:{status:current.status,hasOutcome:Boolean(current.outcome),
     hasCancellationNote:Boolean(current.cancellationNote),version:current.updatedAt.toISOString()},
    after:{status:updated.status,hasOutcome:Boolean(updated.outcome),
     hasCancellationNote:Boolean(updated.cancellationNote),version:updated.updatedAt.toISOString()},
    previousStatus:current.status,status:updated.status,
    hadOutcome:Boolean(input.outcome),hadNote:Boolean(input.note)},
   groupKey:"project:"+scope.project.id+":meetings",
  });
  if(current.status==="DRAFT")return updated;
  await notifyActiveProjectMembers(tx,event.id,{
    projectId:scope.project.id,collegeId:scope.collegeId,roles:["LEARNER"],
    exceptUserId:context.user.id,title:"Project meeting",
    body:input.action==="COMPLETE"?"Meeting completed.":"Meeting cancelled.",
    actionHref:"/learn/projects/"+scope.project.id+"?tab=meetings",
  });
  await notifyActiveProjectMembers(tx,event.id,{
    projectId:scope.project.id,collegeId:scope.collegeId,roles:["MENTOR"],
    exceptUserId:context.user.id,title:"Project meeting",
    body:input.action==="COMPLETE"?"Meeting completed.":"Meeting cancelled.",
    actionHref:"/mentor/projects/"+scope.project.id+"?tab=meetings",
  });
  return updated;
 });
}
