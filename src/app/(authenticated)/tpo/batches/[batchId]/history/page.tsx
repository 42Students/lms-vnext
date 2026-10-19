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
 if(!filters.success)return <div role="alert">Invalid history filter. <Link href={"/tpo/batches/"+batchId+"/history"}>Reset</Link></div>;
 const {batch,events,ready}=await listTpoBatchHistory(await getCurrentRequestContext(),batchId);
 const annotated=batchHistoryDecisionTimeline(events,filters.data.kind);
 const visible=filterTpoBatchHistoryOutcome(annotated,filters.data.after);
 return <div className="min-w-0 space-y-4"><PageHeader eyebrow="TPO · Batches" title={batch.name+" — Decision history"}/>
 <TpoBatchWorkspaceTabs batchId={batchId} active="history" />
 <p className="text-sm text-muted-foreground">Latest 100 batch, class and learner eligibility decisions, newest first. Undo is permitted only when no later change makes the action stale.</p>
 <form method="get" action={"/tpo/batches/"+batchId+"/history"} className="flex flex-wrap items-end gap-3"><label className="text-sm">Event type<Select name="kind" defaultValue={filters.data.kind} className="mt-1 block min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"><option value="ALL">All recorded events</option><option value="DECIDE">Decisions</option><option value="UNDO">Reversals</option></Select></label><label className="text-sm">After-state<Select name="after" defaultValue={filters.data.after} className="mt-1 block min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"><option value="ALL">All outcomes</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option><option value="NOT_DECIDED">Not decided</option></Select></label><Button type="submit">Apply</Button></form>
 <a href={tpoCohortHistoryCsvHref(batchId,filters.data)} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-link">Export matching latest-100 events CSV</a>
 <p className="text-xs text-muted-foreground">Showing {visible.length} of the latest {events.length} batch, class and learner events.</p>
 {!ready?<p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3">Decision history migration has not been applied.</p>:visible.length===0?<p role="status">{events.length===0?"No decisions yet":"No decisions match these filters."}</p>:<ol className="space-y-2">{visible.map(e=><li className="min-w-0 break-words rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm" key={e.id}>
 <strong>Decision: {batchDecisionLabel(e.before)} → {batchDecisionLabel(e.after)}{e.undone?" · Undone":""}</strong>
 <p className="mt-1 text-xs text-muted-foreground">{batchHistoryDate(e.occurredAt)} · {e.actorName??"Unknown actor"} · {e.scopeType==="MEMBERSHIP"?"Learner":e.scopeType==="SECTION"?"Class":"Batch"} · {e.scopeId}</p>
 <p className="text-xs text-body">{e.afterReason??e.beforeReason??"No reason recorded"}</p>
 <p className="text-xs text-muted-foreground">Action: Recorded in audit history</p>
 {e.canRequestUndo?<TpoBatchUndoControl batchId={batchId} actionId={e.actionId}/>:null}
 </li>)}</ol>}
 </div>;
}