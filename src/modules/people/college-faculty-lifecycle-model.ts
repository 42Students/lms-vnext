import { z } from "zod";
import {SUSPENSION_REASON_POLICY} from "./validation";

export const collegeFacultyIdSchema = z.string().uuid();
export const collegeFacultyLifecycleSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("DEACTIVATE"),
    expectedStatus: z.literal("ACTIVE"),
    /** Optional millisecond-CAS token to prevent ACTIVE→SUSPENDED→ACTIVE ABA. */
    expectedUpdatedAt:z.iso.datetime({offset:true}).optional(),
    // Match the audited College Admin membership suspension contract: a
    // meaningful reason is required and persisted alongside session revocation.
    reason: z.string().trim()
      .min(SUSPENSION_REASON_POLICY.min,"Enter a suspension reason of at least 3 characters.")
      .max(SUSPENSION_REASON_POLICY.max),
    confirm: z.literal(true),
  }).strict(),
  z.object({
    action: z.literal("REACTIVATE"),
    expectedStatus: z.literal("SUSPENDED"),
    expectedUpdatedAt:z.iso.datetime({offset:true}).optional(),
    confirm: z.literal(true),
  }).strict(),
]);

export function facultyLifecycleConfirmation(name: string, action: "DEACTIVATE" | "REACTIVATE") {
  return action === "DEACTIVATE"
    ? `Deactivate ${name}? The faculty account will lose access to this college until reactivated.`
    : `Reactivate ${name} in this college?`;
}
