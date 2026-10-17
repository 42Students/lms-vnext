import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectMeetings,projectInstances} from "@/db/schema";
import {type RequestContext,hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {projectMeetingIdSchema} from "./validation";
import {mentorMeetingDecisionSchema,mentorMeetingDecisionStatus} from "./mentor-meeting-decision-model";
import {notifyActiveProjectMembers} from "./project-notification-service";

/** Mentor-only, locked and audited alternative to legacy non-versioned transitions. */
export async function decideMentorProjectMeeting(context:RequestContext,rawProjectId:string,
 rawMeetingId:string,raw:unknown){
 const input=mentorMeetingDecisionSchema.parse(raw);
 const scope=await requireProjectReadAccess(context,rawProjectId);
 const member=context.membership;
 if(scope.access!=="MENTOR"||!member||!hasActiveMembership(context)||
  !hasMembershipRole(context,"MENTOR")||!can(context,"projects.read",{
   collegeId:scope.collegeId,organizationId:scope.organizationId,
  }))throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
 const meetingId=projectMeetingIdSchema.parse(rawMeetingId);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(eq(projectInstances.id,scope.project.id)).for("update").limit(1);
  if(!project||project.status==="ARCHIVED")throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  const [current]=await tx.select().from(projectMeetings).where(and(
   eq(projectMeetings.id,meetingId),eq(projectMeetings.projectId,scope.project.id),
  )).for("update").limit(1);
  if(!current)throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
  if(!mentorMeetingDecisionStatus(input.action,current.status))
   throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
  const expected=new Date(input.expectedUpdatedAt);
  if(current.updatedAt.getTime()!==expected.getTime())
   throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  const now=new Date(Math.max(Date.now(),current.updatedAt.getTime()+1));
  const [updated]=await tx.update(projectMeetings).set(input.action==="COMPLETE"?{
    status:"COMPLETED",outcome:input.outcome??null,cancellationNote:null,updatedAt:now,
   }:{
    status:"CANCELLED",cancellationNote:input.note??null,updatedAt:now,
   }).where(and(eq(projectMeetings.id,current.id),
    eq(projectMeetings.projectId,scope.project.id),
    sql`date_trunc('milliseconds', ${projectMeetings.updatedAt}) = ${expected.toISOString()}::timestamptz`,
   )).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
  // MEN-projects-meetings-27: an unsent mentor draft is not announced to learners.
  if(current.status==="DRAFT")return updated;
  const event=await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project_meeting",subjectId:updated.id,
   summary:input.action==="COMPLETE"?"Project meeting completed":"Project meeting cancelled",
   metadata:{projectId:scope.project.id,previousStatus:current.status,status:updated.status,
    hadOutcome:Boolean(input.outcome),hadNote:Boolean(input.note)},
   groupKey:"project:"+scope.project.id+":meetings",
  });
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
