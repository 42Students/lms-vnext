import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

/**
 * DB045: immutable, per-record attendance mutation. The caller owns a
 * transaction containing the locked current-row write and this event.
 * Database row-version, append-only, tenant/actor and deferred completeness
 * constraints remain authoritative. No external notification is sent here.
 */
export type AttendanceHistorySnapshot = {
  id: string;
  membershipId: string;
  status: string;
  note: string | null;
  markedByUserId: string;
  markedAt: Date;
  version: number;
};

export function attendanceHistoryHasChanged(
  before: AttendanceHistorySnapshot | null,
  after: AttendanceHistorySnapshot,
) {
  return before === null ||
    before.status !== after.status ||
    before.note !== after.note ||
    before.markedByUserId !== after.markedByUserId ||
    before.markedAt.getTime() !== after.markedAt.getTime();
}

export async function appendAttendanceHistoryEvent(
  tx: Pick<ReturnType<typeof getDb>, "execute">,
  args: {
    scheduleEventId: string;
    deliveryId: string;
    collegeId: string;
    actorUserId: string;
    actorMembershipId: string | null;
    actorRole: "FACULTY" | "COLLEGE_ADMIN" | "SUPER_ADMIN";
    before: AttendanceHistorySnapshot | null;
    after: AttendanceHistorySnapshot;
  },
) {
  const { before, after } = args;
  if (before && (
    before.id !== after.id ||
    before.membershipId !== after.membershipId ||
    after.version !== before.version + 1
  )) throw new Error("ATTENDANCE_HISTORY_IDENTITY_OR_VERSION_MISMATCH");
  if (!before && after.version !== 0)
    throw new Error("ATTENDANCE_HISTORY_FIRST_MARK_VERSION_MISMATCH");
  if (!attendanceHistoryHasChanged(before, after))
    throw new Error("ATTENDANCE_HISTORY_NO_CHANGE");
  if (after.markedByUserId !== args.actorUserId)
    throw new Error("ATTENDANCE_HISTORY_ACTOR_MISMATCH");
  if ((args.actorRole === "SUPER_ADMIN") !== (args.actorMembershipId === null))
    throw new Error("ATTENDANCE_HISTORY_ACTOR_ROLE_MISMATCH");

  await tx.execute(sql`
    insert into attendance_record_events (
      attendance_record_id,schedule_event_id,delivery_id,membership_id,
      college_id,actor_user_id,actor_membership_id,actor_role,action,
      previous_status,new_status,previous_note,new_note,
      previous_marked_by_user_id,new_marked_by_user_id,
      previous_marked_at,new_marked_at,
      record_version_before,record_version_after
    ) values (
      ${after.id}::uuid,${args.scheduleEventId}::uuid,${args.deliveryId}::uuid,
      ${after.membershipId}::uuid,${args.collegeId}::uuid,
      ${args.actorUserId}::uuid,${args.actorMembershipId}::uuid,
      ${args.actorRole},${before ? "CORRECT" : "MARK"},
      ${before?.status ?? null},${after.status},
      ${before?.note ?? null},${after.note},
      ${before?.markedByUserId ?? null}::uuid,${after.markedByUserId}::uuid,
      ${before?.markedAt ?? null},${after.markedAt},
      ${before?.version ?? null},${after.version}
    )
  `);
}
