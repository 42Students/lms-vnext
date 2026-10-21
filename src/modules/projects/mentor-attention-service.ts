import { and, desc, eq, inArray, max, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  activityEvents,
  projectMeetings,
  projectSubmissions,
  projectTaskSubmissions,
} from "@/db/schema";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from
  "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import { listMyProjectInstances } from "./member-service";
import { ProjectsServiceError } from "./errors";
import { deriveMentorProjectAttention } from "./mentor-attention";
import { currentPendingMentorSubmissions } from "./mentor-latest-review-model";

/** Legacy mentor notification crosswalk (read-only, never fabricated):
 * resolvedDelivery / latest deliverable => newest persisted projectSubmissions
 *   whose version/status means a learner still needs mentor review;
 * meetingsList => per-project REQUESTED/SCHEDULED/RESCHEDULED meeting rows;
 * project.status => projectInstances.status (ARCHIVED never produces attention);
 * updatedAt => newest scoped activity/project submission/task submission/
 *   meeting update, falling back to projectInstances.updatedAt;
 * user-visible occurredAt => submission.submittedAt for REVIEW and
 *   meeting.startsAt for REQUESTED/MEETING_SOON, rather than read time.
 * This translation preserves vNext membership-scoped identifiers and its
 * independent task-submission/meeting tables; no legacy table is imported.
 */
/** All project IDs originate from active same-college mentor membership rows.
 * Never accept a client-provided project list for this cross-project feed.
 */
export async function listMyMentorProjectAttention(
  context: RequestContext, now: Date = new Date(),
  verifiedRows?:readonly Awaited<ReturnType<typeof listMyProjectInstances>>[number][],
) {
  if (!hasActiveMembership(context) || !hasMembershipRole(context,"MENTOR") || !context.membership ||
      context.user.platformStatus!=="ACTIVE" || !can(context,"projects.read",{
        collegeId:context.membership.collegeId,organizationId:context.membership.organizationId,
      })) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const membership=context.membership!;
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const rows=(verifiedRows??await listMyProjectInstances(context))
    .filter(row=>row.memberRole==="MENTOR"&&row.project.collegeId===membership.collegeId);
  if (!rows.length) return [];
  const ids=rows.map(row=>row.project.id);
  const idSet=new Set(ids);
  // Fetch at most one activity timestamp per authorized project. Do not
  // hydrate years of activity events just to determine the latest update.
  const activityProjectId=sql<string>`split_part(${activityEvents.groupKey}, ':', 2)`;
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
      projectId:activityProjectId,occurredAt:max(activityEvents.occurredAt),
    }).from(activityEvents).where(and(
      eq(activityEvents.module,"PROJECTS"),
      eq(activityEvents.collegeId,membership.collegeId),
      eq(activityEvents.organizationId,membership.organizationId),
      sql`split_part(${activityEvents.groupKey}, ':', 1) = 'project'`,
      inArray(activityProjectId,ids),
    )).groupBy(activityProjectId),
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
    // Defense in depth: even a malformed activity group must not introduce
    // a project outside the authorized Mentor roster.
    if (idSet.has(activity.projectId))
      recordActivity(activity.projectId,activity.occurredAt);
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
