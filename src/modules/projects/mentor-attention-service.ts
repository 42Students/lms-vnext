import { and, desc, eq, inArray, like, max, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents,
  projectMeetings,
  projectSubmissions,
  projectTaskSubmissions,
} from "@/db/schema";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from
  "@/modules/identity/context";
import { listMyProjectInstances } from "./member-service";
import { ProjectsServiceError } from "./errors";
import { deriveMentorProjectAttention } from "./mentor-attention";
import { currentPendingMentorSubmissions } from "./mentor-latest-review-model";

/** All project IDs originate from active same-college mentor membership rows.
 * Never accept a client-provided project list for this cross-project feed.
 */
export async function listMyMentorProjectAttention(
  context: RequestContext, now: Date = new Date(),
  verifiedRows?:readonly Awaited<ReturnType<typeof listMyProjectInstances>>[number][],
) {
  if (!hasActiveMembership(context) || !hasMembershipRole(context,"MENTOR") || !context.membership) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const membership=context.membership!;
  const rows=(verifiedRows??await listMyProjectInstances(context))
    .filter(row=>row.memberRole==="MENTOR");
  if (!rows.length) return [];
  const ids=rows.map(row=>row.project.id);
  const [
    submissions,
    meetings,
    activities,
    submissionActivity,
    meetingActivity,
    taskSubmissionActivity,
  ] = await Promise.all([
    getDb().select({
      id:projectSubmissions.id,projectId:projectSubmissions.projectId,
      status:projectSubmissions.status,submittedAt:projectSubmissions.submittedAt,
      version:projectSubmissions.version,
    }).from(projectSubmissions).where(and(
      inArray(projectSubmissions.projectId,ids),
    )).orderBy(desc(projectSubmissions.version)),
    getDb().select({
      id:projectMeetings.id,projectId:projectMeetings.projectId,
      status:projectMeetings.status,title:projectMeetings.title,
      startsAt:projectMeetings.startsAt,
    }).from(projectMeetings).where(and(
      inArray(projectMeetings.projectId,ids),
      inArray(projectMeetings.status,["REQUESTED","SCHEDULED","RESCHEDULED"]),
    )),
    getDb().select({
      groupKey:activityEvents.groupKey,occurredAt:activityEvents.occurredAt,
    }).from(activityEvents).where(and(
      eq(activityEvents.module,"PROJECTS"),
      eq(activityEvents.collegeId,membership.collegeId),
      eq(activityEvents.organizationId,membership.organizationId),
      or(...ids.map(id=>like(activityEvents.groupKey,"project:"+id+"%"))),
    )).orderBy(desc(activityEvents.occurredAt)),
    getDb().select({
      projectId:projectSubmissions.projectId,
      occurredAt:max(projectSubmissions.updatedAt),
    }).from(projectSubmissions)
      .where(inArray(projectSubmissions.projectId,ids))
      .groupBy(projectSubmissions.projectId),
    getDb().select({
      projectId:projectMeetings.projectId,
      occurredAt:max(projectMeetings.updatedAt),
    }).from(projectMeetings)
      .where(inArray(projectMeetings.projectId,ids))
      .groupBy(projectMeetings.projectId),
    getDb().select({
      projectId:projectTaskSubmissions.projectId,
      occurredAt:max(projectTaskSubmissions.updatedAt),
    }).from(projectTaskSubmissions)
      .where(inArray(projectTaskSubmissions.projectId,ids))
      .groupBy(projectTaskSubmissions.projectId),
  ]);
  const submissionMap=currentPendingMentorSubmissions(submissions);
  const meetingMap=new Map<string,typeof meetings>();
  for (const meeting of meetings) {
    const m=meetingMap.get(meeting.projectId)??[];
    m.push(meeting);
    meetingMap.set(meeting.projectId,m);
  }
  const activityMap=new Map<string,Date>();
  const recordActivity=(projectId:string,occurredAt:Date|null)=>{
    if (!occurredAt) return;
    const current=activityMap.get(projectId);
    if (!current || occurredAt.getTime()>current.getTime()) {
      activityMap.set(projectId,occurredAt);
    }
  };
  for (const activity of activities) {
    if (!activity.groupKey?.startsWith("project:")) continue;
    const suffix=activity.groupKey.slice("project:".length);
    const id=suffix.split(":",1)[0];
    if (id) recordActivity(id,activity.occurredAt);
  }
  for (const row of submissionActivity) {
    recordActivity(row.projectId,row.occurredAt);
  }
  for (const row of meetingActivity) {
    recordActivity(row.projectId,row.occurredAt);
  }
  for (const row of taskSubmissionActivity) {
    recordActivity(row.projectId,row.occurredAt);
  }
  return deriveMentorProjectAttention(rows.map(row=>({
    projectId:row.project.id,projectTitle:row.project.title,
    projectStatus:row.project.status,projectUpdatedAt:row.project.updatedAt,
    lastActivityAt:activityMap.get(row.project.id)??null,
    submission:submissionMap.get(row.project.id)??null,
    meetings:meetingMap.get(row.project.id)??[],
  })),now);
}
