import { z } from "zod";

/** Explicit confirmation is required at the server boundary; reason is
 * persisted in the existing application status history, never fabricated. */
export const learnerWithdrawalReasonSchema = z
  .string()
  .trim()
  .min(3, "Enter a reason of at least three characters.")
  .max(900, "Keep the reason within 900 characters.");

export const learnerApplicationWithdrawalSchema = z.object({
  action: z.literal("WITHDRAW"),
  confirmed: z.literal(true),
  reason: learnerWithdrawalReasonSchema,
}).strict();

export type LearnerApplicationWithdrawal = z.infer<
  typeof learnerApplicationWithdrawalSchema
>;
