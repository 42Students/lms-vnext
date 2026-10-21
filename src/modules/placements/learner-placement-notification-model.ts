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

/** Legacy nullable PUT adapter. Absent/null fields mean "leave unchanged";
 * do not write null as false or clear other placement candidate preferences.
 * The authenticated mutation still requires confirmed=true and CAS baseline.
 */
export const learnerPlacementNotificationLegacyPatchSchema=z.object({
 jobNotificationsEnabled:z.boolean().nullable().optional(),
 notifyMatchingJobs:z.boolean().nullable().optional(),
 notifyApplicationUpdates:z.boolean().nullable().optional(),
}).strict();
export function mergeLegacyPlacementNotificationPatch(
 current:{notifyMatchingJobs:boolean;notifyApplicationUpdates:boolean},
 raw:unknown,
){
 const patch=learnerPlacementNotificationLegacyPatchSchema.parse(raw);
 return {
  notifyMatchingJobs:patch.notifyMatchingJobs??patch.jobNotificationsEnabled??current.notifyMatchingJobs,
  notifyApplicationUpdates:patch.notifyApplicationUpdates??current.notifyApplicationUpdates,
 };
}
