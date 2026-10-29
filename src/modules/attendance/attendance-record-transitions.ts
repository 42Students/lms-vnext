/** DB06 attendance write planner. Preserve the current row identity on each
 * correction so immutable per-record history can refer to the same parent.
 * This pure planner never authorizes a roster; the transaction writer must
 * validate the full active delivery roster and lock its parent event first.
 */
export type ExistingAttendanceRecord = Readonly<{
  id: string;
  membershipId: string;
  status: string;
}>;

export function planAttendanceRecordTransitions(
  existingRecords: readonly ExistingAttendanceRecord[],
  absentMembershipIds: readonly string[],
  presentMembershipIds: readonly string[],
) {
  const byMembership = new Map<string, ExistingAttendanceRecord>();
  for (const record of existingRecords) {
    if (byMembership.has(record.membershipId)) {
      throw new Error("ATTENDANCE_DUPLICATE_CURRENT_RECORD");
    }
    byMembership.set(record.membershipId, record);
  }
  const requested = new Set([...absentMembershipIds, ...presentMembershipIds]);
  if (requested.size !== absentMembershipIds.length + presentMembershipIds.length) {
    throw new Error("ATTENDANCE_DUPLICATE_ROSTER_MEMBER");
  }
  if ([...byMembership.keys()].some((id) => !requested.has(id))) {
    throw new Error("ATTENDANCE_RECORD_OUTSIDE_REQUESTED_ROSTER");
  }

  const previousAbsentMembershipIds = existingRecords
    .filter((record) => record.status === "ABSENT")
    .map((record) => record.membershipId);
  const insertAbsentMembershipIds: string[] = [];
  const changeToAbsentRecordIds: string[] = [];
  const changeToPresentRecordIds: string[] = [];

  for (const membershipId of absentMembershipIds) {
    const existing = byMembership.get(membershipId);
    if (!existing) insertAbsentMembershipIds.push(membershipId);
    else if (existing.status !== "ABSENT") changeToAbsentRecordIds.push(existing.id);
  }
  for (const membershipId of presentMembershipIds) {
    const existing = byMembership.get(membershipId);
    // Preserve explicitly recorded PRESENT, EXCUSED, MEDICAL and LATE rows.
    if (existing?.status === "ABSENT") changeToPresentRecordIds.push(existing.id);
  }
  return {
    previousAbsentMembershipIds,
    insertAbsentMembershipIds,
    changeToAbsentRecordIds,
    changeToPresentRecordIds,
  };
}
