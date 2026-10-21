import { z } from "zod";
import { isCareerRoundVisible } from "./learner-round-visibility-policy";

const interviewLinkParams = z.object({
  applicationId: z.string().uuid().optional(),
  roundId: z.string().uuid().optional(),
}).strict().refine(
  value => Boolean(value.applicationId) === Boolean(value.roundId),
  { message: "Both interview identifiers are required together" },
);

/** Old schedule cards used numeric application IDs and synthetic iv-/test- round
 * IDs. They cannot be mapped to a vNext round UUID without a scoped legacy-ID
 * lookup. Open the learner's own list instead of turning an old bookmark into
 * a 404; never infer ownership or select a round from the numeric identifier. */
const legacyInterviewLinkParams = z.object({
  applicationId: z.string().regex(/^(?:[0-9]+|iv-[0-9]+)$/),
  roundId: z.string().regex(/^iv-[0-9]+$/),
}).strict();
const legacyTestLinkParams = z.object({
  applicationId: z.string().regex(/^[0-9]+$/),
  roundId: z.string().regex(/^test-[0-9]+$/),
}).strict().refine(value => value.roundId === "test-" + value.applicationId);

type OwnInterview = {
  applicationId: string;
  roundId: string;
  roundKind: string;
};

/**
 * Only the already-scoped, persisted learner round list establishes access.
 * A well-formed UUID is never, by itself, permission to open an interview.
 */
export function resolveOwnInterviewDeepLink(
  ownRounds: readonly OwnInterview[],
  rawQuery: unknown,
): { valid: true; key: string | null } | { valid: false } {
  const parsed = interviewLinkParams.safeParse(rawQuery);
  if (!parsed.success) {
    if (legacyInterviewLinkParams.safeParse(rawQuery).success ||
        legacyTestLinkParams.safeParse(rawQuery).success) {
      return { valid: true, key: null };
    }
    return { valid: false };
  }
  const { applicationId, roundId } = parsed.data;
  if (!applicationId || !roundId) return { valid: true, key: null };
  const own = ownRounds.some(row =>
    row.applicationId === applicationId &&
    row.roundId === roundId &&
    isCareerRoundVisible("INTERVIEW", row.roundKind)
  );
  return own
    ? { valid: true, key: applicationId + ":" + roundId }
    : { valid: false };
}
