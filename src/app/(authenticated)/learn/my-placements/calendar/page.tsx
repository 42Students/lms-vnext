import { redirect } from "next/navigation";

/**
 * Legacy /calendar is an address shim for the placement Schedule month tab.
 * vNext calls that tab ?view=calendar (not ?view=month).
 * Do not load a second placement workspace or expose results before the
 * destination applies its own active learner membership authorization.
 * The canonical Schedule calendar merges verified un-applied job deadlines
 * and scoped college exam blackout days with the learner's round events.
 */
export default async function LearnerCalendarLegacyRedirect({searchParams}:{
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  // Preserve harmless original deep-link selectors when forwarding to the
  // member-authorized Schedule workspace, without trusting a requested view.
  const original=await searchParams;
  const query=new URLSearchParams({view:"calendar"});
  for (const key of ["date","roundId","jobId"] as const) {
    const value=original[key];
    if (typeof value==="string" && value.length<=100)query.set(key,value);
  }
  redirect("/learn/my-placements/schedule?"+query.toString());
}
