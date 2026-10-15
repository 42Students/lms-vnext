import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoLearnerRegistrationHistory} from "@/modules/placements/tpo-learner-registration-history-service";
import {tpoRegistrationHistoryChangeLabel,tpoRegistrationHistorySourceLabel} from "@/modules/placements/tpo-registration-history-model";
export const dynamic="force-dynamic";
export default async function TpoLearnerBatchRegistrationHistory({params}:{params:Promise<{batchId:string;membershipId:string}>}){
 const {batchId,membershipId}=await params;
 const data=await getTpoLearnerRegistrationHistory(await getCurrentRequestContext(),batchId,membershipId);
 return <main className="min-w-0 space-y-5">
  <h1 className="text-xl font-semibold">{data.learnerName} — Registration history</h1>
  <p className="text-sm text-muted-foreground">Batch: {data.batch.name}. Immutable recorded choice transitions only; this page does not display contact details or raw consent versions, and visiting never changes a choice.</p>
  <Link href={"/tpo/batches/"+encodeURIComponent(batchId)+"/registrations"} className="inline-flex min-h-11 items-center text-primary-text underline">Back to registrations</Link>
  {!data.ready?<p role="status" className="rounded border border-border p-4">Registration-event history is unavailable.</p>:<>
   {data.truncated?<p role="status" className="rounded border border-border p-4">Only the newest 100 events are shown. Older evidence may exist.</p>:null}
   {data.events.length===0?<p role="status">No registration-choice history recorded.</p>:<ol className="space-y-3">{data.events.map(event=>
    <li key={event.id} className="rounded-lg border border-border bg-surface p-4">
     <h2 className="font-semibold">{tpoRegistrationHistoryChangeLabel(event.previousChoice,event.nextChoice)}</h2>
     <p className="text-sm text-body">{tpoRegistrationHistorySourceLabel(event.source)}</p>
     <time dateTime={event.occurredAt.toISOString()} className="text-xs text-muted-foreground">{event.occurredAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</time>
    </li>)}</ol>}
  </>}
 </main>;
}
