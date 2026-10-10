import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, membershipRoles, projectInstances, projectMeetings,
  projectMembers, projectSprints, users,
} from "@/db/schema";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from
  "@/modules/identity/context";
import { ProjectsServiceError } from "./errors";
import type { MentorMeetingCalendarItem } from "./mentor-calendar-view";

/**
 * Single tenant-scoped query across ONLY currently assigned mentor projects.
 * A platform/college admin cannot use this personal Mentor endpoint to browse
 * arbitrary projects. The active mentor membership and role are rechecked in DB.
 */
export async function listMyMentorCalendarMeetings(
  context: RequestContext,
): Promise<MentorMeetingCalendarItem[]> {
  const membership = context.membership;
  if (!hasActiveMembership(context) || !hasMembershipRole(context, "MENTOR") ||
      !membership) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }

  const rows = await getDb().select({
    id: projectMeetings.id,
    projectId: projectInstances.id,
    projectTitle: projectInstances.title,
    projectStatus: projectInstances.status,
    title: projectMeetings.title,
    status: projectMeetings.status,
    startsAt: projectMeetings.startsAt,
    endsAt: projectMeetings.endsAt,
    timeZone: projectMeetings.timeZone,
    meetingUrl: projectMeetings.meetingUrl,
    linkedSprintTitle: projectSprints.title,
  })
    .from(projectMembers)
    .innerJoin(projectInstances, eq(projectInstances.id, projectMembers.projectId))
    .innerJoin(projectMeetings, eq(projectMeetings.projectId, projectInstances.id))
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, projectMembers.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "MENTOR"),
    ))
    .leftJoin(projectSprints, and(
      eq(projectSprints.id, projectMeetings.linkedSprintId),
      eq(projectSprints.projectId, projectInstances.id),
    ))
    .where(and(
      eq(projectMembers.membershipId, membership.id),
      eq(projectMembers.role, "MENTOR"),
      isNull(projectMembers.endedAt),
      eq(projectInstances.collegeId, membership.collegeId),
      eq(collegeMemberships.collegeId, membership.collegeId),
      eq(collegeMemberships.userId, context.user.id),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .orderBy(asc(projectMeetings.startsAt), asc(projectMeetings.id));

  return rows.map(row => ({
    id: row.id,
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    projectStatus: row.projectStatus,
    title: row.title,
    status: row.status as MentorMeetingCalendarItem["status"],
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    timeZone: row.timeZone,
    meetingUrl: row.meetingUrl,
    linkedSprintTitle: row.linkedSprintTitle,
  }));
}
