import Link from "next/link";
import {tpoRegistrationHistoryFilterHref} from "@/modules/placements/tpo-registration-history-filter-model";
import {tpoRegistrationHistoryQuery,filterTpoRegistrationEvents} from "@/modules/placements/tpo-registration-history-filter-model";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoLearnerRegistrationHistory} from "@/modules/placements/tpo-learner-registration-history-service";
import {tpoRegistrationHistoryChangeLabel,tpoRegistrationHistorySourceLabel} from "@/modules/placements/tpo-registration-history-model";
export const dynamic="force-dynamic";
export default async function TpoLearnerBatchRegistrationHistory({params,searchParams}:{params:Promise<{batchId:string;membershipId:string}>;searchParams:Promise<{source?:string|string[];event?:string|string[]}>}){
 const {batchId,membershipId}=await params;
 const raw=await searchParams;
 const filters=tpoRegistrationHistoryQuery.safeParse({source:Array.isArray(raw.source)?raw.source[0]:raw.source,event:Array.isArray(raw.event)?raw.event[0]:raw.event});
 if(!filters.success)return <main role="alert">Invalid registration history filters. <Link href={"/tpo/batches/"+batchId+"/registrations/"+membershipId+"/history"}>Reset</Link></main>;
 const data=await getTpoLearnerRegistrationHistory(await getCurrentRequestContext(),batchId,membershipId);
 const visible=filterTpoRegistrationEvents(data.events,filters.data);
 return <main className="min-w-0 space-y-5">
  <h1 className="text-xl font-semibold">{data.learnerName} — Registration history</h1>
  <p className="text-sm text-muted-foreground">Batch: {data.batch.name}. Immutable recorded choice transitions only; this page does not display contact details or raw consent versions, and visiting never changes a choice.</p>
  <Link href={"/tpo/batches/"+encodeURIComponent(batchId)+"/registrations"} className="inline-flex min-h-11 items-center text-primary-text underline">Back to registrations</Link>
  <form method="get" className="flex flex-wrap items-end gap-3"><label className="text-sm">Recorded source<select name="source" defaultValue={filters.data.source} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All sources</option><option value="SELF">Learner</option><option value="TPO">Placement cell</option><option value="BACKFILL">Backfill</option></select></label><label className="text-sm">Change type<select name="event" defaultValue={filters.data.event} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All events</option><option value="INITIAL">First recorded choice</option><option value="CHANGE">Subsequent changes</option></select></label><button type="submit" className="min-h-11 rounded bg-primary px-4 text-sm text-on-primary">Apply</button></form>
  <Link href={tpoRegistrationHistoryFilterHref(batchId,membershipId,filters.data,true)} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm text-primary-text">Export matching recorded events CSV</Link>
  <p className="text-xs text-muted-foreground">Showing {visible.length} of {data.events.length} newest recorded events. Filters operate only on this bounded history sample.</p>
  {!data.ready?<p role="status" className="rounded border border-border p-4">Registration-event history is unavailable.</p>:<>
   {data.truncated?<p role="status" className="rounded border border-border p-4">Only the newest 100 events are shown. Older evidence may exist.</p>:null}
   {visible.length===0?<p role="status">No matching registration-change events in this sample.</p>:<ol className="space-y-3">{visible.map(event=>
    <li key={event.id} className="rounded-lg border border-border bg-surface p-4">
     <h2 className="font-semibold">{tpoRegistrationHistoryChangeLabel(event.previousChoice,event.nextChoice)}</h2>
     <p className="text-sm text-body">{tpoRegistrationHistorySourceLabel(event.source)}</p>
     <time dateTime={event.occurredAt.toISOString()} className="text-xs text-muted-foreground">{event.occurredAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</time>
    </li>)}</ol>}
  </>}
 </main>;
}
