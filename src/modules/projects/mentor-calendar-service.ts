import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, membershipRoles, projectInstances, projectMeetings,
  projectMembers, projectSprints, users,
} from "@/db/schema";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from
  "@/modules/identity/context";
import { ProjectsServiceError } from "./errors";
import { can } from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import type { MentorMeetingCalendarItem } from "./mentor-calendar-view";

/**
 * Organizer time zones describe how meetings were originally scheduled, not
 * the attendee's display zone. vNext intentionally displays every meeting in
 * IST, even when the mentor or organizer is elsewhere. The persisted
 * timestamptz is already an instant: format it as UTC ISO once, never parse
 * an organizer's wall clock in the server or apply a second zone offset.
 */
export const MENTOR_CALENDAR_VIEW_ZONE = "Asia/Kolkata" as const;

export function mentorCalendarMeetingInstants(
  startsAt:Date, endsAt:Date, organizerZone:string,
) {
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) ||
      endsAt.getTime() < startsAt.getTime()) {
    throw new Error("Invalid persisted mentor meeting time window");
  }
  let validOrganizerZone=organizerZone.trim();
  try {
    new Intl.DateTimeFormat("en-IN",{timeZone:validOrganizerZone}).format(startsAt);
  } catch {
    validOrganizerZone=MENTOR_CALENDAR_VIEW_ZONE;
  }
  return {
    startsAt:startsAt.toISOString(),
    endsAt:endsAt.toISOString(),
    organizerZone:validOrganizerZone,
    displayZone:MENTOR_CALENDAR_VIEW_ZONE,
  };
}

/**
 * Single tenant-scoped query across ONLY currently assigned mentor projects.
 * A platform/college admin cannot use this personal Mentor endpoint to browse
 * arbitrary projects. The active mentor membership and role are rechecked in DB.
 */
export async function listMyMentorCalendarMeetings(
  context: RequestContext,
): Promise<MentorMeetingCalendarItem[]> {
  const membership = context.membership;
  if (context.user.platformStatus !== "ACTIVE" ||
      !hasActiveMembership(context) || !hasMembershipRole(context, "MENTOR") ||
      !membership || !can(context,"projects.read",{
        collegeId:membership.collegeId,organizationId:membership.organizationId,
      })) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  // A direct call/export must not bypass the page-level Projects feature flag.
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");

  const rows = await getDb().select({
    id: projectMeetings.id,
    projectId: projectInstances.id,
    projectTitle: projectInstances.title,
    projectStatus: projectInstances.status,
    title: projectMeetings.title,
    status: projectMeetings.status,
    meetingType: projectMeetings.meetingType,
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
      isNull(projectInstances.deletedAt),
      isNull(projectMeetings.deletedAt),
      eq(collegeMemberships.collegeId, membership.collegeId),
      eq(collegeMemberships.userId, context.user.id),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .orderBy(asc(projectMeetings.startsAt), asc(projectMeetings.id));

  return rows.map(row => {
    const window=mentorCalendarMeetingInstants(row.startsAt,row.endsAt,row.timeZone);
    return {
    id: row.id,
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    projectStatus: row.projectStatus,
    title: row.title,
    status: row.status as MentorMeetingCalendarItem["status"],
    ...(row.meetingType === null ? {} : { meetingType: row.meetingType }),
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    timeZone: window.organizerZone,
    meetingUrl: row.meetingUrl,
    linkedSprintTitle: row.linkedSprintTitle,
    };
  });
}
