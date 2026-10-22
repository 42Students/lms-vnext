import { redirect } from "next/navigation";
import { z } from "zod";
import { parseLearnerCareerDate } from "@/modules/placements/learner-career-date-model";

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
  const date=original["date"];
  if(typeof date==="string" && parseLearnerCareerDate(date)!==null)
    query.set("date",date);
  // Preserve only member-scoped UUID selectors; legacy integer keys must be
  // resolved by an authorized crosswalk, never treated as canonical IDs.
  for (const key of ["roundId","jobId"] as const) {
    const value=original[key];
    if(typeof value==="string" && z.uuid().safeParse(value).success)
      query.set(key,value);
  }
  const kind=original["kind"];
  if(typeof kind==="string" &&
    ["ALL","ASSESSMENT","INTERVIEW","TALK","OTHER"].includes(kind))
    query.set("kind",kind);
  redirect("/learn/my-placements/schedule?"+query.toString());
}
