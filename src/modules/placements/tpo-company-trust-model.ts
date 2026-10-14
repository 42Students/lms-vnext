import { z } from "zod";

export const tpoCompanyTrustChangeSchema = z.object({
  relationshipId: z.string().uuid(),
  expectedTrusted: z.boolean(),
  nextTrusted: z.boolean(),
  reason: z.string().trim().min(8).max(500),
  confirmed: z.literal(true),
}).strict().refine(
  (value) => value.expectedTrusted !== value.nextTrusted,
  { message: "The requested company trust state has not changed", path: ["nextTrusted"] },
);

/** Pure stale-state decision; the same check executes under row lock. */
export function isTpoCompanyTrustCurrent(
  storedTrusted: boolean,
  expectedTrusted: boolean,
  nextTrusted: boolean,
): boolean {
  return storedTrusted === expectedTrusted && nextTrusted !== storedTrusted;
}
