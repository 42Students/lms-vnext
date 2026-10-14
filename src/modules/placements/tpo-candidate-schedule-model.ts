import { z } from "zod";
export const candidateScheduleJobIdSchema = z.string().uuid();
export type RoundCandidateScheduleFact = {
  id: string; name: string; kind: string; status: string;
  scheduledAt: Date | null; venue: string | null; mode: string | null;
  participants: readonly { applicationId: string; displayName: string | null }[];
};

/**
 * Round-level time and venue are inherited informational context.
 * There are NO migrated candidate-specific panel/slot assignments.
 */
export function projectTpoCandidateScheduleReadiness(
  rounds: readonly RoundCandidateScheduleFact[],
) {
  const all = rounds.flatMap(round => round.participants.map(person => ({
    applicationId: person.applicationId,
    name: person.displayName?.trim() || "Unnamed learner",
    roundId: round.id, roundName: round.name, roundKind: round.kind,
    roundStatus: round.status,
    roundStartIso: round.scheduledAt?.toISOString() ?? null,
    roundVenue: round.venue,
    roundMode: round.mode,
    candidateSlot: null as string | null,
    panelAssignment: null as string | null,
    evidence: "ROUND_ONLY" as const,
  })));
  return {
    total: all.length, displayed: all.slice(0, 1000),
    limited: all.length > 1000,
    unassigned: all.length, // unavailable assignments, not confirmed unassigned people
  };
}
