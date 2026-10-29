/**
 * DB-035/045 SOURCE-ONLY producer contract. Do not call from live writers until
 * L01 atomically registers attendance_record_events and attendance_records.version,
 * and L05 cuts over every Faculty/College Admin writer in the same release.
 *
 * The previous/current pair comes from a locked, persisted row inside one
 * transaction. Never fabricate a previous row or event actor from a request.
 */
export type AttendanceHistoryStatus =
  "PRESENT" | "ABSENT" | "EXCUSED" | "MEDICAL" | "LATE";
export type AttendanceHistoryActorRole = "FACULTY" | "COLLEGE_ADMIN" | "SUPER_ADMIN";

export type AttendanceHistorySnapshot = Readonly<{
  id: string;
  scheduleEventId: string;
  membershipId: string;
  status: AttendanceHistoryStatus;
  note: string | null;
  markedByUserId: string;
  markedAt: Date;
  version: number;
}>;

export type AttendanceHistoryInput = Readonly<{
  before: AttendanceHistorySnapshot | null;
  after: AttendanceHistorySnapshot;
  deliveryId: string;
  collegeId: string;
  actorUserId: string;
  actorMembershipId: string | null;
  actorRole: AttendanceHistoryActorRole;
  occurredAt: Date;
}>;

/** Return exact column/value names for the staged DB06 event table. */
export function buildAttendanceHistoryEvent(input: AttendanceHistoryInput) {
  const {before, after} = input;
  const time = input.occurredAt.getTime();
  if (!Number.isFinite(time) || !Number.isFinite(after.markedAt.getTime()) ||
      (before && !Number.isFinite(before.markedAt.getTime()))) {
    throw new Error("ATTENDANCE_HISTORY_INVALID_TIME");
  }
  const statuses: readonly string[] = [
    "PRESENT", "ABSENT", "EXCUSED", "MEDICAL", "LATE",
  ];
  if (!statuses.includes(after.status) ||
      (before && !statuses.includes(before.status))) {
    throw new Error("ATTENDANCE_HISTORY_INVALID_STATUS");
  }
  if (!["FACULTY", "COLLEGE_ADMIN", "SUPER_ADMIN"].includes(input.actorRole)) {
    throw new Error("ATTENDANCE_HISTORY_INVALID_ACTOR_ROLE");
  }
  if (after.markedByUserId !== input.actorUserId) {
    throw new Error("ATTENDANCE_HISTORY_MARKER_ACTOR_MISMATCH");
  }
  if ((input.actorRole === "SUPER_ADMIN") !== (input.actorMembershipId === null)) {
    throw new Error("ATTENDANCE_HISTORY_ACTOR_MEMBERSHIP_MISMATCH");
  }
  if (!Number.isSafeInteger(after.version) || after.version < 0) {
    throw new Error("ATTENDANCE_HISTORY_INVALID_VERSION");
  }
  if (before && (before.id !== after.id ||
      before.scheduleEventId !== after.scheduleEventId ||
      before.membershipId !== after.membershipId)) {
    throw new Error("ATTENDANCE_HISTORY_PARENT_IDENTITY_CHANGED");
  }
  if (before && (!Number.isSafeInteger(before.version) ||
      after.version !== before.version + 1)) {
    throw new Error("ATTENDANCE_HISTORY_NON_SEQUENTIAL_VERSION");
  }
  if (!before && after.version !== 0) {
    throw new Error("ATTENDANCE_HISTORY_INITIAL_VERSION_NOT_ZERO");
  }
  if (before && before.status === after.status &&
      before.note === after.note &&
      before.markedByUserId === after.markedByUserId &&
      before.markedAt.getTime() === after.markedAt.getTime()) {
    throw new Error("ATTENDANCE_HISTORY_NO_CHANGE");
  }
  return {
    attendanceRecordId: after.id,
    scheduleEventId: after.scheduleEventId,
    deliveryId: input.deliveryId,
    membershipId: after.membershipId,
    collegeId: input.collegeId,
    actorUserId: input.actorUserId,
    actorMembershipId: input.actorMembershipId,
    actorRole: input.actorRole,
    action: before ? "CORRECT" as const : "MARK" as const,
    previousStatus: before?.status ?? null,
    newStatus: after.status,
    previousNote: before?.note ?? null,
    newNote: after.note,
    previousMarkedByUserId: before?.markedByUserId ?? null,
    newMarkedByUserId: after.markedByUserId,
    previousMarkedAt: before?.markedAt ?? null,
    newMarkedAt: after.markedAt,
    recordVersionBefore: before?.version ?? null,
    recordVersionAfter: after.version,
    occurredAt: input.occurredAt,
  };
}
