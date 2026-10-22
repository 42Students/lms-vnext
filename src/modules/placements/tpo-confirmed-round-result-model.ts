import { z } from "zod";
import { stagePlacementRoundResultInputSchema } from "./validation";

export const confirmedTpoRoundResultSchema = z.object({
  confirmed: z.literal(true),
  expectedCurrentResultId: z.string().uuid().nullable(),
  result: stagePlacementRoundResultInputSchema,
}).strict();

/** Explicitly model the legacy labels without inventing a SELECTED state. */
export const TPO_RESULT_LABELS = {
  PASS: "Pass",
  FAIL: "Not cleared",
  HOLD: "Waitlist",
  ABSENT: "Absent",
} as const;

export function canEditTpoRoundResult(
  round: { kind: string; status: string },
  current: { resultStatus: string | null },
): boolean {
  return round.kind !== "TALK" &&
    (round.status === "SCHEDULED" || round.status === "COMPLETED") &&
    current.resultStatus !== "APPLIED";
}

export function canApplyTpoRoundResult(
  round: { kind: string; status: string },
  current: { resultStatus: string | null },
): boolean {
  return round.kind !== "TALK" &&
    round.status === "COMPLETED" &&
    current.resultStatus === "STAGED";
}
