import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {tpoRegistrationHistoryFilterHref} from "@/modules/placements/tpo-registration-history-filter-model";
import {tpoRegistrationHistoryQuery,filterTpoRegistrationEvents} from "@/modules/placements/tpo-registration-history-filter-model";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoLearnerRegistrationHistory} from "@/modules/placements/tpo-learner-registration-history-service";
import {tpoRegistrationHistoryChangeLabel,tpoRegistrationHistorySourceLabel} from "@/modules/placements/tpo-registration-history-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatDateTimeIst } from "@/lib/format-date";
export const dynamic="force-dynamic";
export default async function TpoLearnerBatchRegistrationHistory({params,searchParams}:{params:Promise<{batchId:string;membershipId:string}>;searchParams:Promise<{source?:string|string[];event?:string|string[]}>}){
 const {batchId,membershipId}=await params;
 const raw=await searchParams;
 const filters=tpoRegistrationHistoryQuery.safeParse({source:Array.isArray(raw.source)?raw.source[0]:raw.source,event:Array.isArray(raw.event)?raw.event[0]:raw.event});
 if(!filters.success)return <div className="min-w-0 space-y-4"><PageHeader title="Registration history"/><Alert tone="error">Invalid registration history filters. <TextLink className="inline-flex min-h-11 items-center md:min-h-9" href={"/tpo/batches/"+batchId+"/registrations/"+membershipId+"/history"}>Reset</TextLink></Alert></div>;
 const data=await getTpoLearnerRegistrationHistory(await getCurrentRequestContext(),batchId,membershipId);
 const visible=filterTpoRegistrationEvents(data.events,filters.data);
 return <div className="min-w-0 space-y-4">
  <PageHeader title={data.learnerName+" — Registration history"} description="Recorded placement choices, newest first." actions={<><TextLink href={"/tpo/batches/"+encodeURIComponent(batchId)+"/registrations"} className="inline-flex min-h-11 w-full items-center justify-center md:w-auto">Back to registrations</TextLink><ButtonLink variant="secondary" href={tpoRegistrationHistoryFilterHref(batchId,membershipId,filters.data,true)} className="w-full md:w-auto">Export matching recorded events CSV</ButtonLink></>}/>
  <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" aria-label="Filter history"><Label className="min-w-0">Recorded source<Select name="source" defaultValue={filters.data.source} className="mt-[6px] block min-h-11 md:min-h-9 w-full"><option value="ALL">All sources</option><option value="SELF">Learner</option><option value="TPO">Placement cell</option><option value="BACKFILL">Backfill</option></Select></Label><Label className="min-w-0">Change type<Select name="event" defaultValue={filters.data.event} className="mt-[6px] block min-h-11 md:min-h-9 w-full"><option value="ALL">All events</option><option value="INITIAL">First recorded choice</option><option value="CHANGE">Subsequent changes</option></Select></Label><Button type="submit" className="min-h-11 w-full lg:w-auto">Apply</Button></form>
  <p className="text-xs text-muted-foreground">Showing {visible.length} of {data.events.length} newest recorded events. Filters operate only on this bounded history sample.</p>
  {!data.ready?<Alert tone="warning">Registration-event history is unavailable.</Alert>:<>
   {data.truncated?<Alert tone="warning">Only the newest 100 events are shown. Older evidence may exist.</Alert>:null}
   {visible.length===0?<EmptyState title="No matching registration-change events in this sample." action={<TextLink href={"/tpo/batches/"+encodeURIComponent(batchId)+"/registrations/"+encodeURIComponent(membershipId)+"/history"} className="inline-flex min-h-11 items-center">Reset</TextLink>}/>:<ol className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{visible.map(event=>
    <li key={event.id} className="min-w-0 space-y-2 py-4">
     <Heading level={2}>{tpoRegistrationHistoryChangeLabel(event.previousChoice,event.nextChoice)}</Heading>
     <p className="text-sm text-body">{tpoRegistrationHistorySourceLabel(event.source)}</p>
     <time dateTime={event.occurredAt.toISOString()} className="text-xs text-muted-foreground">{formatDateTimeIst(event.occurredAt)} IST</time>
    </li>)}</ol>}
  </>}
 <p className="max-w-[72ch] text-sm text-muted-foreground">Batch: {data.batch.name}. Immutable recorded choice transitions only; this page does not display contact details or raw consent versions, and visiting never changes a choice.</p>
 </div>;
}
