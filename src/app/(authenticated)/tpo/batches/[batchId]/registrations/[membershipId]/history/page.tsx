import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {PageHeader} from "@/components/ui/page-header";
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
 if(!filters.success)return <div role="alert">Invalid registration history filters. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9" href={"/tpo/batches/"+batchId+"/registrations/"+membershipId+"/history"}>Reset</Link></div>;
 const data=await getTpoLearnerRegistrationHistory(await getCurrentRequestContext(),batchId,membershipId);
 const visible=filterTpoRegistrationEvents(data.events,filters.data);
 return <div className="min-w-0 space-y-4">
  <PageHeader title={data.learnerName+" — Registration history"} description="Recorded placement choices, newest first."/>
  <p className="text-sm text-muted-foreground">Batch: {data.batch.name}. Immutable recorded choice transitions only; this page does not display contact details or raw consent versions, and visiting never changes a choice.</p>
  <Link href={"/tpo/batches/"+encodeURIComponent(batchId)+"/registrations"} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Back to registrations</Link>
  <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 md:grid-cols-2 xl:grid-cols-3"><label className="min-w-0 text-sm">Recorded source<Select name="source" defaultValue={filters.data.source} className="mt-1 block min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"><option value="ALL">All sources</option><option value="SELF">Learner</option><option value="TPO">Placement cell</option><option value="BACKFILL">Backfill</option></Select></label><label className="min-w-0 text-sm">Change type<Select name="event" defaultValue={filters.data.event} className="mt-1 block min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"><option value="ALL">All events</option><option value="INITIAL">First recorded choice</option><option value="CHANGE">Subsequent changes</option></Select></label><Button type="submit" className="min-h-11 justify-self-start">Apply</Button></form>
  <Link href={tpoRegistrationHistoryFilterHref(batchId,membershipId,filters.data,true)} className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Export matching recorded events CSV</Link>
  <p className="text-xs text-muted-foreground">Showing {visible.length} of {data.events.length} newest recorded events. Filters operate only on this bounded history sample.</p>
  {!data.ready?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm">Registration-event history is unavailable.</p>:<>
   {data.truncated?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm">Only the newest 100 events are shown. Older evidence may exist.</p>:null}
   {visible.length===0?<p role="status">No matching registration-change events in this sample.</p>:<ol className="divide-y divide-border border-y border-border">{visible.map(event=>
    <li key={event.id} className="min-w-0 space-y-1 py-3">
     <h2 className="font-semibold">{tpoRegistrationHistoryChangeLabel(event.previousChoice,event.nextChoice)}</h2>
     <p className="text-sm text-body">{tpoRegistrationHistorySourceLabel(event.source)}</p>
     <time dateTime={event.occurredAt.toISOString()} className="text-xs text-muted-foreground">{event.occurredAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</time>
    </li>)}</ol>}
  </>}
 </div>;
}
