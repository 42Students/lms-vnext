import { z } from "zod";

export const tpoScheduleConflictsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
}).strict();

export type TpoScheduleRoundFact = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  name: string;
  mode: string | null;
  venue: string | null;
  scheduledAt: Date;
  durationMinutes: number | null;
};

type AssessableRound = TpoScheduleRoundFact & {
  normalizedVenue: string;
  endsAt: Date;
};

/**
 * A collision is proven only for two distinct on-campus round records
 * with the same nonblank normalized venue and overlapping persisted
 * [start, end) intervals. Missing venue/mode/duration is UNKNOWN, not clear.
 * This is a room/time overlap signal, not a student or faculty conflict.
 */
export function projectTpoScheduleConflicts(facts: readonly TpoScheduleRoundFact[]) {
  const assessable: AssessableRound[] = [];
  const unassessable: Array<{ id: string; name: string; jobTitle: string; reason: string }> = [];
  let virtual = 0;

  for (const round of facts) {
    if (round.mode === "VIRTUAL") {
      virtual++;
      continue;
    }
    const venue = round.venue?.trim().replace(/\s+/g, " ");
    const reason = round.mode !== "ON_CAMPUS"
      ? "Mode not recorded as on-campus"
      : !venue
        ? "Venue not recorded"
        : !round.durationMinutes || round.durationMinutes <= 0
          ? "Duration not recorded"
          : !Number.isFinite(round.scheduledAt.getTime())
            ? "Invalid scheduled time"
            : null;
    if (reason) {
      unassessable.push({ id: round.id, name: round.name, jobTitle: round.jobTitle, reason });
      continue;
    }
    // The checks above establish venue and positive duration.
    if (!venue || !round.durationMinutes) continue;
    assessable.push({
      ...round,
      normalizedVenue: venue.toLocaleLowerCase("en-IN"),
      endsAt: new Date(round.scheduledAt.getTime() + round.durationMinutes * 60_000),
    });
  }

  assessable.sort((a, b) =>
    a.scheduledAt.getTime() - b.scheduledAt.getTime() || a.id.localeCompare(b.id),
  );
  const conflicts: Array<{
    left: AssessableRound;
    right: AssessableRound;
    overlapMinutes: number;
  }> = [];
  for (let i = 0; i < assessable.length; i++) {
    const left = assessable[i]!;
    for (let j = i + 1; j < assessable.length; j++) {
      const right = assessable[j]!;
      if (right.scheduledAt.getTime() >= left.endsAt.getTime()) break;
      if (left.id === right.id || left.normalizedVenue !== right.normalizedVenue) continue;
      const ms = Math.min(left.endsAt.getTime(), right.endsAt.getTime()) -
        Math.max(left.scheduledAt.getTime(), right.scheduledAt.getTime());
      if (ms > 0) conflicts.push({ left, right, overlapMinutes: ms / 60_000 });
    }
  }
  return {
    conflicts,
    unassessable,
    assessedCount: assessable.length,
    virtualExcluded: virtual,
    totalScheduled: facts.length,
  };
}
