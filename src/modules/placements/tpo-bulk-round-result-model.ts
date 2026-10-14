import { z } from "zod";
import { stagePlacementRoundResultInputSchema } from "./validation";

export const bulkTpoRoundResultSchema = z.object({
  confirmed: z.literal(true),
  entries: z.array(z.object({
    expectedCurrentResultId: z.string().uuid().nullable(),
    result: stagePlacementRoundResultInputSchema,
  }).strict()).min(1).max(25).refine((entries) =>
    new Set(entries.map((item) => item.result.applicationId)).size === entries.length,
    "Duplicate application IDs are not permitted",
  ),
}).strict();

export type TpoBulkRoundResultOutcome = {
  applicationId: string;
  status: "staged" | "ineligible";
  resultId?: string;
  reason?: string;
};

/** Summarize only confirmed persisted outcomes. No attempted row counts as saved. */
export function summarizeBulkRoundResults(
  results: readonly TpoBulkRoundResultOutcome[],
) {
  return {
    staged: results.filter((item) => item.status === "staged").length,
    ineligible: results.filter((item) => item.status === "ineligible").length,
  };
}
