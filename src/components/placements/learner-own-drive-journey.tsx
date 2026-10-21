import Link from "next/link";
import type {getOwnLearnerDriveJourney} from "@/modules/placements/learner-historical-drive-service";
type Journey=NonNullable<Awaited<ReturnType<typeof getOwnLearnerDriveJourney>>>;
/** LEARNER-placements-24: these are recorded job/round statuses only.
 * No unverified selection result or attendance claim is invented.
 */
export function LearnerOwnDriveJourney({journey}:{journey:Journey}){
 const stopped=journey.jobStatus==="CANCELLED"||journey.jobStatus==="CLOSED";
 const scheduled=journey.rounds.find(round=>round.scheduledAt &&
  Number.isFinite(Date.parse(round.scheduledAt)) && Date.parse(round.scheduledAt)>Date.now());
 return <div className="min-w-0 space-y-4" aria-label="Own application journey">
  {stopped?<aside role="status" className="min-w-0 border-b border-warning py-4">
   <h2 className="text-base font-semibold">{journey.jobStatus==="CANCELLED"?
    "This drive was cancelled":"This drive is closed"}</h2>
   {journey.reason?<p className="mt-2 text-sm text-body leading-[22px]">{journey.reason}</p>:null}
   <p className="mt-2 text-sm leading-[22px]">Your application history remains available.</p>
   <Link className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text underline md:min-h-9"
    href={"/learn/my-placements/applications/"+journey.applicationId}>View my application</Link>
  </aside>:null}
  <section aria-label="Your progress" className="min-w-0 rounded-[12px] border border-border p-4 md:p-5">
   <h2 className="font-semibold">Your progress</h2>
   <p className="mt-1 text-sm leading-[22px]">Application status: {journey.applicationStatus.replaceAll("_"," ").toLowerCase()}</p>
   <p className="mt-2 text-xs text-muted-foreground">
     Interview bookings are confirmed through your application record. Check its updates for verified notifications.
   </p>
   <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9"
    href={"/learn/my-placements/applications/"+journey.applicationId}>See where your application stands</Link>
  </section>
  <section aria-label="Selection process" className="min-w-0 rounded-[12px] border border-border p-4 md:p-5">
   <h2 className="font-semibold">Selection process</h2>
   {scheduled?<div role="status" className="mt-3 rounded-lg border border-border bg-surface-subtle p-3">
     <p className="text-sm font-semibold">Next scheduled round: {scheduled.name}</p>
     <p className="mt-1 text-xs text-muted-foreground">
       A round is scheduled for this drive; this does not by itself confirm your individual interview booking.
     </p>
     <Link href={"/learn/my-placements/applications/"+journey.applicationId}
       className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
       View your application and interview updates
     </Link>
   </div>:null}
   {journey.rounds.length?<ol className="mt-3 min-w-0 space-y-2">
    {journey.rounds.map(round=><li key={round.id} className="min-w-0 break-words border-t border-border py-3 text-sm">
     <strong>{round.sequence}. {round.name}</strong>
     <p>Round status: {round.status.replaceAll("_"," ").toLowerCase()}</p>
     {round.scheduledAt?<p>{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",
      timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(round.scheduledAt))}</p>:null}
    </li>)}
   </ol>:<p className="mt-2 text-sm leading-[22px]">The placement cell has not published the selection rounds yet.</p>}
  </section>
 </div>;
}
