import { z } from "zod";

export const collegeFacultyIdSchema = z.string().uuid();
export const collegeFacultyLifecycleSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("DEACTIVATE"),
    expectedStatus: z.literal("ACTIVE"),
    reason: z.string().trim().min(3).max(500),
    confirm: z.literal(true),
  }).strict(),
  z.object({
    action: z.literal("REACTIVATE"),
    expectedStatus: z.literal("SUSPENDED"),
    confirm: z.literal(true),
  }).strict(),
]);

export function facultyLifecycleConfirmation(name: string, action: "DEACTIVATE" | "REACTIVATE") {
  return action === "DEACTIVATE"
    ? `Deactivate ${name}? The faculty account will lose access to this college until reactivated.`
    : `Reactivate ${name} in this college?`;
}
