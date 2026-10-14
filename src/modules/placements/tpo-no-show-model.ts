import type { TpoRoundRosterRow } from "./tpo-round-drive-day-model";

export type TpoNoShowReport = ReturnType<typeof buildTpoNoShowReport>;

/**
 * A no-show is ONLY a persisted ABSENT attendance mark. Missing marks,
 * WAITING, unknown statuses and negative interview results are never
 * inferred to mean no-show.
 */
export function buildTpoNoShowReport(rows: readonly TpoRoundRosterRow[]) {
  const explicitAbsences = rows.filter((row) => row.attendance === "ABSENT");
  const awaitingMark = rows.filter((row) => row.attendance === "WAITING");
  const unknown = rows.filter((row) => row.attendance === "UNKNOWN");
  return {
    totalRoster: rows.length,
    explicitlyAbsentCount: explicitAbsences.length,
    awaitingMarkCount: awaitingMark.length,
    unknownCount: unknown.length,
    explicitAbsences,
    awaitingMark,
  };
}
