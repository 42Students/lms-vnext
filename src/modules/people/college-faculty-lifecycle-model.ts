import { z } from "zod";

export const collegeFacultyIdSchema = z.string().uuid();
export const collegeFacultyLifecycleSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("DEACTIVATE"),
    expectedStatus: z.literal("ACTIVE"),
    /** Optional millisecond-CAS token to prevent ACTIVE→SUSPENDED→ACTIVE ABA. */
    expectedUpdatedAt:z.iso.datetime({offset:true}).optional(),
    // Match the legacy no-reason lifecycle request while capping any supplied explanation.
    reason: z.string().trim().max(1000).optional(),
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
