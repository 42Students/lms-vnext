import { z } from "zod";
export const collegeOfferingLifecycleIdSchema = z.string().uuid();
export const collegeOfferingLifecycleSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("ARCHIVE"), expectedStatus: z.literal("ACTIVE"), confirm: z.literal(true) }),
  z.strictObject({ action: z.literal("RESTORE"), expectedStatus: z.literal("ARCHIVED"), confirm: z.literal(true) }),
]);
export function offeringLifecycleConfirmation(name:string, action:"ARCHIVE"|"RESTORE") {
  return action === "ARCHIVE"
    ? `Archive ${name}? Existing active Section deliveries must be ended first.`
    : `Restore ${name}? The course and academic period must still be eligible.`;
}
