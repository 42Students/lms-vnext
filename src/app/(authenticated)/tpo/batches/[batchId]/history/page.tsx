import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {PageHeader} from "@/components/ui/page-header";
import {batchDecisionLabel,batchHistoryDate} from "@/modules/placements/tpo-batch-labels-model";
import {tpoCohortHistoryCsvHref} from "@/modules/placements/tpo-batch-history-csv-model";
import Link from "next/link";
import { TpoBatchWorkspaceTabs } from "@/components/tpo/tpo-batch-workspace-tabs";
import {batchHistoryViewSchema,filterTpoBatchHistoryKind,filterTpoBatchHistoryOutcome} from "@/modules/placements/tpo-batch-history-view-model";
import {batchHistoryDecisionTimeline} from "@/modules/placements/tpo-batch-history-undo-model";
import { TpoBatchUndoControl } from "@/components/tpo/tpo-batch-undo-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listTpoBatchHistory } from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function BatchHistory({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{kind?:string|string[];after?:string|string[]}>}){
 const {batchId}=await params;
 const raw=await searchParams;
 const filters=batchHistoryViewSchema.safeParse({kind:Array.isArray(raw.kind)?raw.kind[0]:raw.kind,after:Array.isArray(raw.after)?raw.after[0]:raw.after});
 if(!filters.success)return <div role="alert">Invalid history filter. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9" href={"/tpo/batches/"+batchId+"/history"}>Reset</Link></div>;
 const {batch,events,ready}=await listTpoBatchHistory(await getCurrentRequestContext(),batchId);
 const annotated=batchHistoryDecisionTimeline(events,filters.data.kind);
 const visible=filterTpoBatchHistoryOutcome(annotated,filters.data.after);
 return <div className="min-w-0 space-y-5"><PageHeader title={batch.name+" — Decision history"} description="Review recorded eligibility decisions and undo availability."/>
 <TpoBatchWorkspaceTabs batchId={batchId} active="history" />
 <p className="text-sm text-muted-foreground">Latest 100 batch, class and learner eligibility decisions, newest first. Undo is permitted only when no later change makes the action stale.</p>
 <form method="get" action={"/tpo/batches/"+batchId+"/history"} className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 md:grid-cols-2 xl:grid-cols-3"><label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Event type<Select name="kind" defaultValue={filters.data.kind} className="mt-1 block min-h-11 w-full md:min-h-9"><option value="ALL">All recorded events</option><option value="DECIDE">Decisions</option><option value="UNDO">Reversals</option></Select></label><label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">After-state<Select name="after" defaultValue={filters.data.after} className="mt-1 block min-h-11 w-full md:min-h-9"><option value="ALL">All outcomes</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option><option value="NOT_DECIDED">Not decided</option></Select></label><Button type="submit" className="min-h-11 w-full md:min-h-9">Apply</Button></form>
 <a href={tpoCohortHistoryCsvHref(batchId,filters.data)} className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Export matching latest-100 events CSV</a>
 <p className="text-xs text-muted-foreground">Showing {visible.length} of the latest {events.length} batch, class and learner events.</p>
 {!ready?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm">Decision history migration has not been applied.</p>:visible.length===0?<p role="status">{events.length===0?"No decisions yet":"No decisions match these filters."}</p>:<ol className="divide-y divide-border border-y border-border">{visible.map(e=><li className="min-w-0 space-y-1 break-words py-3 text-sm" key={e.id}>
 <strong>Decision: {batchDecisionLabel(e.before)} → {batchDecisionLabel(e.after)}{e.undone?" · Undone":""}</strong>
 <p className="mt-1 text-xs text-muted-foreground">{batchHistoryDate(e.occurredAt)} · {e.actorName??"Unknown actor"} · {e.scopeType==="MEMBERSHIP"?"Learner":e.scopeType==="SECTION"?"Class":"Batch"} · {e.scopeId}</p>
 <p className="text-xs text-body">{e.afterReason??e.beforeReason??"No reason recorded"}</p>
 <p className="text-xs text-muted-foreground">Action: Recorded in audit history</p>
 {e.canRequestUndo?<TpoBatchUndoControl batchId={batchId} actionId={e.actionId}/>:null}
 </li>)}</ol>}
 </div>;
}