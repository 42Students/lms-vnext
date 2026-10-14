/**
 * Pure, read-only presentation of the college-scoped persisted venue collision
 * assessment on an individual drive's scheduling controls.
 *
 * Unsaved form edits are NOT checked here. A missing/failed assessment is
 * never interpreted as "no conflicts".
 */
export type DriveScheduleCollisionSource = {
  limited: boolean;
  conflicts: readonly {
    left: { id: string; companyName: string; jobTitle: string; name: string; venue: string | null };
    right: { id: string; companyName: string; jobTitle: string; name: string; venue: string | null };
    overlapMinutes: number;
  }[];
  unassessable: readonly { id: string; reason: string }[];
};

export type TpoDriveScheduleWarnings = {
  state: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
  warnings: { roundId: string; messages: string[] }[];
  collisions: number;
  unknown: number;
};

export function projectTpoDriveScheduleWarnings(
  input: DriveScheduleCollisionSource | null,
  roundIds: readonly string[],
): TpoDriveScheduleWarnings {
  if (input === null) {
    return { state: "UNAVAILABLE", warnings: [], collisions: 0, unknown: 0 };
  }
  const chosen = new Set(roundIds);
  const warnings = new Map<string, string[]>();
  let collisions = 0;
  let unknown = 0;
  for (const pair of input.conflicts) {
    for (const [here, other] of [[pair.left, pair.right], [pair.right, pair.left]] as const) {
      if (!chosen.has(here.id)) continue;
      collisions++;
      const message = "Persisted venue overlap (" + pair.overlapMinutes +
        " min) with " + other.companyName + " · " + other.jobTitle + " · " +
        other.name + " at " + (here.venue ?? "the recorded venue") + ".";
      warnings.set(here.id, [...(warnings.get(here.id) ?? []), message]);
    }
  }
  for (const item of input.unassessable) {
    if (!chosen.has(item.id)) continue;
    unknown++;
    warnings.set(item.id, [
      ...(warnings.get(item.id) ?? []),
      "Could not assess this round: " + item.reason + ".",
    ]);
  }
  return {
    state: input.limited ? "LIMITED" : "AVAILABLE",
    warnings: Array.from(warnings, ([roundId, messages]) => ({ roundId, messages })),
    collisions,
    unknown,
  };
}
