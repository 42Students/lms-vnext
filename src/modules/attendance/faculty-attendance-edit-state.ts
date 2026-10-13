/**
 * Learner absence records, not absence/presence rows, are persisted by
 * the Faculty marking endpoint. A roster member with a record is marked
 * absent in the editor; everyone else starts present.
 *
 * Keep this derived state scoped to the selected schedule event.
 */
export function initialAbsencesForSession(
  roster: readonly { membershipId: string }[],
  absenceRecords: readonly { scheduleEventId: string; membershipId: string }[],
  scheduleEventId: string,
): Set<string> {
  const recorded = new Set(
    absenceRecords
      .filter((record) => record.scheduleEventId === scheduleEventId)
      .map((record) => record.membershipId),
  );
  return new Set(
    roster
      .filter((member) => recorded.has(member.membershipId))
      .map((member) => member.membershipId),
  );
}
