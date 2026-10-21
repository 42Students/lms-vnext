import { redirect } from "next/navigation";

/**
 * Legacy /calendar is an address shim for the placement Schedule month tab.
 * vNext calls that tab ?view=calendar (not ?view=month).
 * Do not load a second placement workspace or expose results before the
 * destination applies its own active learner membership authorization.
 */
export default async function LearnerCalendarLegacyRedirect() {
  redirect("/learn/my-placements/schedule?view=calendar");
}
