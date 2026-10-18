import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, projectMembers, users } from "@/db/schema";
import { deliverInAppNotificationInTransaction } from "@/modules/activity/notification-service";

type Writer = Parameters<typeof deliverInAppNotificationInTransaction>[0];
type ProjectNotice = {
  projectId: string;
  collegeId: string;
  title: string;
  body: string;
  actionHref: string;
  exceptUserId?: string;
};

export function projectNoticeHref(role: "LEARNER" | "MENTOR", projectId: string): string {
  return (role === "MENTOR" ? "/mentor/projects/" : "/learn/projects/") + encodeURIComponent(projectId);
}

/** Only the current project's active, same-college members are eligible.
 * The notification writer independently re-checks the event/recipient tenant scope.
 */
export async function notifyActiveProjectMembers(
  tx: Writer, eventId: string, notice: ProjectNotice & { roles?: ("LEARNER" | "MENTOR")[] },
) {
  const rows = await tx.select({ userId: collegeMemberships.userId })
    .from(projectMembers)
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, projectMembers.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      eq(projectMembers.projectId, notice.projectId),
      isNull(projectMembers.endedAt),
      eq(collegeMemberships.collegeId, notice.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
      notice.roles?.length ? inArray(projectMembers.role, notice.roles) : undefined,
    ));
  return deliverInAppNotificationInTransaction(
    tx, eventId, [...new Set(rows.map(row => row.userId))].filter(id => id !== notice.exceptUserId),
    { title: notice.title, body: notice.body, actionHref: notice.actionHref },
  );
}

/** For a newly added, reassigned, or removed member: verify active college membership.
 * A removed Project member is still allowed their own removal notice.
 */
export async function notifyProjectMemberships(
  tx: Writer, eventId: string, notice: ProjectNotice & { membershipIds: string[] },
) {
  if (!notice.membershipIds.length) return { delivered: 0 };
  const rows = await tx.select({ userId: collegeMemberships.userId })
    .from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(
      inArray(collegeMemberships.id, [...new Set(notice.membershipIds)]),
      eq(collegeMemberships.collegeId, notice.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
    ));
  return deliverInAppNotificationInTransaction(
    tx, eventId, [...new Set(rows.map(row => row.userId))].filter(id => id !== notice.exceptUserId),
    { title: notice.title, body: notice.body, actionHref: notice.actionHref },
  );
}
