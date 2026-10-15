import { z } from "zod";
import { publicCollegeJoinTokenSchema } from "@/modules/placements/public-college-join-model";

export const publicUnsubscribeTokenSchema = publicCollegeJoinTokenSchema;
export const publicUnsubscribeConfirmationSchema = z.object({
  token: publicUnsubscribeTokenSchema,
  confirm: z.literal(true),
}).strict();

export type UnsubscribeResult = "INVALID_OR_EXPIRED" | "CONFIRM_REQUIRED" | "ALREADY_SUPPRESSED" | "SUPPRESS";

/** Only a same-origin POST with explicit confirmation may write a suppression.
 * Caller must validate and hash the token, then check its stored expiry/scope.
 */
export function campaignUnsubscribeDecision(input: {
  tokenValid: boolean;
  confirmed: boolean;
  alreadySuppressed: boolean;
}): UnsubscribeResult {
  if (!input.tokenValid) return "INVALID_OR_EXPIRED";
  if (!input.confirmed) return "CONFIRM_REQUIRED";
  return input.alreadySuppressed ? "ALREADY_SUPPRESSED" : "SUPPRESS";
}
