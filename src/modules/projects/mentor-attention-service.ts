import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, projectMeetings, projectSubmissions } from "@/db/schema";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from
  "@/modules/identity/context";
import { listMyProjectInstances } from "./member-service";
import { ProjectsServiceError } from "./errors";
import { deriveMentorProjectAttention } from "./mentor-attention";

/** All project IDs originate from active same-college mentor membership rows.
 * Never accept a client-provided project list for this cross-project feed.
 */
export async function listMyMentorProjectAttention(
  context: RequestContext, now: Date = new Date(),
) {
  if (!hasActiveMembership(context) || !hasMembershipRole(context,"MENTOR")) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const rows=(await listMyProjectInstances(context))
    .filter(row=>row.memberRole==="MENTOR");
  if (!rows.length) return [];
  const ids=rows.map(row=>row.project.id);
  const [submissions, meetings, activities] = await Promise.all([
    getDb().select({
      id:projectSubmissions.id,projectId:projectSubmissions.projectId,
      status:projectSubmissions.status,submittedAt:projectSubmissions.submittedAt,
      version:projectSubmissions.version,
    }).from(projectSubmissions).where(and(
      inArray(projectSubmissions.projectId,ids),eq(projectSubmissions.status,"SUBMITTED"),
    )).orderBy(desc(projectSubmissions.version)),
    getDb().select({
      id:projectMeetings.id,projectId:projectMeetings.projectId,
      status:projectMeetings.status,title:projectMeetings.title,
      startsAt:projectMeetings.startsAt,
    }).from(projectMeetings).where(and(
      inArray(projectMeetings.projectId,ids),
      inArray(projectMeetings.status,["REQUESTED","SCHEDULED"]),
    )),
    getDb().select({
      groupKey:activityEvents.groupKey,occurredAt:activityEvents.occurredAt,
    }).from(activityEvents).where(and(
      eq(activityEvents.module,"PROJECTS"),
      inArray(activityEvents.groupKey,ids.map(id=>"project:"+id)),
    )).orderBy(desc(activityEvents.occurredAt)),
  ]);
  const submissionMap=new Map<string,(typeof submissions)[number]>();
  for (const submission of submissions) {
    if (!submissionMap.has(submission.projectId)) submissionMap.set(submission.projectId,submission);
  }
  const meetingMap=new Map<string,typeof meetings>();
  for (const meeting of meetings) {
    const m=meetingMap.get(meeting.projectId)??[];
    m.push(meeting);
    meetingMap.set(meeting.projectId,m);
  }
  const activityMap=new Map<string,Date>();
  for (const activity of activities) {
    if (!activity.groupKey?.startsWith("project:")) continue;
    const id=activity.groupKey.slice("project:".length);
    if (!activityMap.has(id)) activityMap.set(id,activity.occurredAt);
  }
  return deriveMentorProjectAttention(rows.map(row=>({
    projectId:row.project.id,projectTitle:row.project.title,
    projectStatus:row.project.status,projectUpdatedAt:row.project.updatedAt,
    lastActivityAt:activityMap.get(row.project.id)??null,
    submission:submissionMap.get(row.project.id)??null,
    meetings:meetingMap.get(row.project.id)??[],
  })),now);
}
