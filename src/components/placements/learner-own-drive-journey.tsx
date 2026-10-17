import Link from "next/link";
import type {getOwnLearnerDriveJourney} from "@/modules/placements/learner-historical-drive-service";
type Journey=NonNullable<Awaited<ReturnType<typeof getOwnLearnerDriveJourney>>>;
/** LEARNER-placements-24: these are recorded job/round statuses only.
 * No unverified selection result or attendance claim is invented.
 */
export function LearnerOwnDriveJourney({journey}:{journey:Journey}){
 const stopped=journey.jobStatus==="CANCELLED"||journey.jobStatus==="CLOSED";
 return <div className="space-y-4" aria-label="Own application journey">
  {stopped?<aside role="status" className="rounded-lg border border-warning bg-surface-subtle p-4">
   <h2 className="text-base font-semibold">{journey.jobStatus==="CANCELLED"?
    "This drive was cancelled":"This drive is closed"}</h2>
   {journey.reason?<p className="mt-2 text-sm text-body">{journey.reason}</p>:null}
   <p className="mt-2 text-sm">Your application history remains available.</p>
   <Link className="font-semibold text-primary-text underline"
    href={"/learn/my-placements/applications/"+journey.applicationId}>View my application</Link>
  </aside>:null}
  <section aria-label="Your progress" className="rounded-lg border border-border bg-surface p-4">
   <h2 className="font-semibold">Your progress</h2>
   <p className="mt-1 text-sm">Application status: {journey.applicationStatus.replaceAll("_"," ").toLowerCase()}</p>
   <Link className="text-sm font-semibold text-primary-text underline"
    href={"/learn/my-placements/applications/"+journey.applicationId}>See where your application stands</Link>
  </section>
  <section aria-label="Selection process" className="rounded-lg border border-border bg-surface p-4">
   <h2 className="font-semibold">Selection process</h2>
   {journey.rounds.length?<ol className="mt-3 space-y-2">
    {journey.rounds.map(round=><li key={round.id} className="border-t border-border py-2 text-sm">
     <strong>{round.sequence}. {round.name}</strong>
     <p>Round status: {round.status.replaceAll("_"," ").toLowerCase()}</p>
     {round.scheduledAt?<p>{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",
      timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(round.scheduledAt))}</p>:null}
    </li>)}
   </ol>:<p className="mt-2 text-sm">The placement cell has not published the selection rounds yet.</p>}
  </section>
 </div>;
}
