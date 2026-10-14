import { z } from "zod";

/** Explicit confirmation is required at the server boundary; reason is
 * persisted in the existing application status history, never fabricated. */
export const learnerWithdrawalReasonSchema = z
  .string()
  .trim()
  .min(5, "Enter a reason of at least five characters.")
  .max(500, "Keep the reason within 500 characters.");

export const learnerApplicationWithdrawalSchema = z.object({
  action: z.literal("WITHDRAW"),
  confirmed: z.literal(true),
  reason: learnerWithdrawalReasonSchema,
}).strict();

export type LearnerApplicationWithdrawal = z.infer<
  typeof learnerApplicationWithdrawalSchema
>;
