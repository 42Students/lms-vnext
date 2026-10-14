import { z } from "zod";
import { isCareerRoundVisible } from "./learner-round-visibility-policy";

const interviewLinkParams = z.object({
  applicationId: z.string().uuid().optional(),
  roundId: z.string().uuid().optional(),
}).strict().refine(
  value => Boolean(value.applicationId) === Boolean(value.roundId),
  { message: "Both interview identifiers are required together" },
);

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
  if (!parsed.success) return { valid: false };
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
