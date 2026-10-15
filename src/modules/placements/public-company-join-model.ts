import { z } from "zod";
import {
  publicCollegeJoinCodeSchema,
  publicCollegeJoinTokenSchema,
  publicRecruiterWorkEmailSchema,
  workEmailDomain,
} from "@/modules/placements/public-college-join-model";

export const publicCompanyJoinInputSchema = z.object({
  token: publicCollegeJoinTokenSchema,
  workEmail: publicRecruiterWorkEmailSchema,
  code: publicCollegeJoinCodeSchema,
}).strict();

export type CompanyJoinOutcome =
  | "INVALID_OR_EXPIRED"
  | "EMAIL_DOMAIN_MISMATCH"
  | "ALREADY_JOINED"
  | "AWAITING_VERIFICATION"
  | "VERIFIED";

/** Must only run after loading a live persisted invitation by hashed token.
 * The company domain is controlled by the stored invitation, not client input.
 */
export function companyJoinOutcome(input: {
  invitationValid: boolean;
  expectedCompanyDomain: string;
  workEmail: string;
  alreadyJoined: boolean;
  codeVerified: boolean;
}): CompanyJoinOutcome {
  if (!input.invitationValid) return "INVALID_OR_EXPIRED";
  const actual = workEmailDomain(input.workEmail);
  const expected = input.expectedCompanyDomain.trim().toLowerCase();
  if (!actual || !expected || actual !== expected) return "EMAIL_DOMAIN_MISMATCH";
  if (input.alreadyJoined) return "ALREADY_JOINED";
  return input.codeVerified ? "VERIFIED" : "AWAITING_VERIFICATION";
}
