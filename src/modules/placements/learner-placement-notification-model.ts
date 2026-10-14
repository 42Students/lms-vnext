import { z } from "zod";

/** Placement-only notification choices. No cross-tenant selectors or other
 * opportunity preferences are accepted on this narrow write endpoint. */
export const learnerPlacementNotificationInputSchema = z.object({
  notifyMatchingJobs: z.boolean(),
  notifyApplicationUpdates: z.boolean(),
  confirmed: z.literal(true),
  expected: z.object({
    notifyMatchingJobs: z.boolean(),
    notifyApplicationUpdates: z.boolean(),
  }).strict(),
}).strict();

export type LearnerPlacementNotificationInput =
  z.infer<typeof learnerPlacementNotificationInputSchema>;

export function placementNotificationChanges(
  before: {notifyMatchingJobs:boolean;notifyApplicationUpdates:boolean},
  after: LearnerPlacementNotificationInput,
) {
  return before.notifyMatchingJobs !== after.notifyMatchingJobs ||
    before.notifyApplicationUpdates !== after.notifyApplicationUpdates;
}

export function placementNotificationIsStale(
  current: {notifyMatchingJobs:boolean;notifyApplicationUpdates:boolean},
  expected: {notifyMatchingJobs:boolean;notifyApplicationUpdates:boolean},
) {
  return current.notifyMatchingJobs !== expected.notifyMatchingJobs ||
    current.notifyApplicationUpdates !== expected.notifyApplicationUpdates;
}
