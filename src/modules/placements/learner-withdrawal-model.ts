import { z } from "zod";

/** Confirmed self-withdrawal needs no reason in the old LMS. A supplied
 * reason is validated and persisted in application history, never invented.
 * Placement-cell requests use learnerWithdrawalReasonSchema separately. */
export const learnerWithdrawalReasonSchema = z
  .string()
  .trim()
  .min(3, "Enter a reason of at least three characters.")
  .max(900, "Keep the reason within 900 characters.");

export const learnerApplicationWithdrawalSchema = z.object({
  action: z.literal("WITHDRAW"),
  confirmed: z.literal(true),
  reason: z.preprocess(
    value => typeof value === "string" && value.trim() === "" ? undefined : value,
    learnerWithdrawalReasonSchema.optional(),
  ),
}).strict();

export type LearnerApplicationWithdrawal = z.infer<
  typeof learnerApplicationWithdrawalSchema
>;
