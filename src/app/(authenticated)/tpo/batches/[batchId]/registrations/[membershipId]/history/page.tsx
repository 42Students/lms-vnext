import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
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
 if(!filters.success)return <div className="min-w-0 space-y-4"><PageHeader title="Registration history"/><Alert tone="error">Invalid registration history filters. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9" href={"/tpo/batches/"+batchId+"/registrations/"+membershipId+"/history"}>Reset</Link></Alert></div>;
 const data=await getTpoLearnerRegistrationHistory(await getCurrentRequestContext(),batchId,membershipId);
 const visible=filterTpoRegistrationEvents(data.events,filters.data);
 return <div className="min-w-0 space-y-4">
  <PageHeader title={data.learnerName+" — Registration history"} description="Recorded placement choices, newest first." actions={<><Link href={"/tpo/batches/"+encodeURIComponent(batchId)+"/registrations"} className="lms-inline-link inline-flex min-h-11 w-full items-center justify-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:w-auto">Back to registrations</Link><Link href={tpoRegistrationHistoryFilterHref(batchId,membershipId,filters.data,true)} className="lms-inline-link inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 text-sm text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:w-auto">Export matching recorded events CSV</Link></>}/>
  <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><label className="min-w-0 text-[13px] text-[var(--lms-neutral-400)] font-semibold leading-4">Recorded source<Select name="source" defaultValue={filters.data.source} className="mt-[6px] block min-h-11 min-[768px]:min-h-9 w-full"><option value="ALL">All sources</option><option value="SELF">Learner</option><option value="TPO">Placement cell</option><option value="BACKFILL">Backfill</option></Select></label><label className="min-w-0 text-[13px] text-[var(--lms-neutral-400)] font-semibold leading-4">Change type<Select name="event" defaultValue={filters.data.event} className="mt-[6px] block min-h-11 min-[768px]:min-h-9 w-full"><option value="ALL">All events</option><option value="INITIAL">First recorded choice</option><option value="CHANGE">Subsequent changes</option></Select></label><Button type="submit" className="min-h-11 w-full lg:w-auto">Apply</Button></form>
  <p className="text-xs text-muted-foreground">Showing {visible.length} of {data.events.length} newest recorded events. Filters operate only on this bounded history sample.</p>
  {!data.ready?<Alert tone="warning">Registration-event history is unavailable.</Alert>:<>
   {data.truncated?<Alert tone="warning">Only the newest 100 events are shown. Older evidence may exist.</Alert>:null}
   {visible.length===0?<EmptyState title="No matching registration-change events in this sample." action={<Link href={"/tpo/batches/"+encodeURIComponent(batchId)+"/registrations/"+encodeURIComponent(membershipId)+"/history"} className="inline-flex min-h-11 items-center font-semibold text-link underline">Reset</Link>}/>:<ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{visible.map(event=>
    <li key={event.id} className="min-w-0 space-y-2 py-4">
     <h2 className="font-semibold">{tpoRegistrationHistoryChangeLabel(event.previousChoice,event.nextChoice)}</h2>
     <p className="text-sm text-body">{tpoRegistrationHistorySourceLabel(event.source)}</p>
     <time dateTime={event.occurredAt.toISOString()} className="text-xs text-muted-foreground">{event.occurredAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</time>
    </li>)}</ol>}
  </>}
 <p className="max-w-[72ch] text-sm text-muted-foreground">Batch: {data.batch.name}. Immutable recorded choice transitions only; this page does not display contact details or raw consent versions, and visiting never changes a choice.</p>
 </div>;
}
