import {batchDecisionLabel,batchHistoryDate} from "@/modules/placements/tpo-batch-labels-model";
import {tpoCohortHistoryCsvHref} from "@/modules/placements/tpo-batch-history-csv-model";
import Link from "next/link";
import { TpoBatchWorkspaceTabs } from "@/components/tpo/tpo-batch-workspace-tabs";
import {batchHistoryViewSchema,filterTpoBatchHistoryKind,filterTpoBatchHistoryOutcome} from "@/modules/placements/tpo-batch-history-view-model";
import {actionableBatchHistory} from "@/modules/placements/tpo-batch-history-undo-model";
import { TpoBatchUndoControl } from "@/components/tpo/tpo-batch-undo-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listTpoBatchHistory } from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function BatchHistory({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{kind?:string|string[];after?:string|string[]}>}){
 const {batchId}=await params;
 const raw=await searchParams;
 const filters=batchHistoryViewSchema.safeParse({kind:Array.isArray(raw.kind)?raw.kind[0]:raw.kind,after:Array.isArray(raw.after)?raw.after[0]:raw.after});
 if(!filters.success)return <main role="alert">Invalid history filter. <Link href={"/tpo/batches/"+batchId+"/history"}>Reset</Link></main>;
 const {batch,events,ready}=await listTpoBatchHistory(await getCurrentRequestContext(),batchId);
 const annotated=actionableBatchHistory(events);
 const visible=filterTpoBatchHistoryOutcome(filterTpoBatchHistoryKind(annotated,filters.data.kind),filters.data.after);
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{batch.name} — Decision history</h1>
 <TpoBatchWorkspaceTabs batchId={batchId} active="history" />
 <p className="text-sm text-muted-foreground">Latest 100 batch, class and learner eligibility decisions, newest first. Undo is permitted only when no later change makes the action stale.</p>
 <form method="get" action={"/tpo/batches/"+batchId+"/history"} className="flex flex-wrap items-end gap-3"><label className="text-sm">Event type<select name="kind" defaultValue={filters.data.kind} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All recorded events</option><option value="DECIDE">Decisions</option><option value="UNDO">Reversals</option></select></label><label className="text-sm">After-state<select name="after" defaultValue={filters.data.after} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All outcomes</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option><option value="NOT_DECIDED">Not decided</option></select></label><button type="submit" className="min-h-11 rounded bg-primary px-4 text-on-primary">Apply</button></form>
 <a href={tpoCohortHistoryCsvHref(batchId,filters.data)} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm text-primary-text">Export matching latest-100 events CSV</a>
 <p className="text-xs text-muted-foreground">Showing {visible.length} of the latest {events.length} batch, class and learner events.</p>
 {!ready?<p role="status" className="rounded border border-border p-4">Decision history migration has not been applied.</p>:visible.length===0?<p role="status">{events.length===0?"No batch, class or learner decisions recorded yet.":"No matching decisions in the latest recorded batch and learner events."}</p>:<ol className="space-y-2">{visible.map(e=><li className="min-w-0 break-words rounded border border-border bg-surface p-3 text-sm" key={e.id}>
 <strong>{e.kind==="UNDO"?"Undo":"Decision"}: {batchDecisionLabel(e.before)} → {batchDecisionLabel(e.after)}</strong>
 <p className="mt-1 text-xs text-muted-foreground">{batchHistoryDate(e.occurredAt)} · {e.actorName??"Unknown actor"} · {e.scopeType==="MEMBERSHIP"?"Learner":e.scopeType==="SECTION"?"Class":"Batch"} · {e.scopeId}</p>
 <p className="text-xs text-body">{e.afterReason??e.beforeReason??"No reason recorded"}</p>
 <p className="text-xs text-muted-foreground">Action: Recorded in audit history</p>
 {e.reversesActionId?<p className="text-xs">Undone</p>:null}
 {e.canRequestUndo?<TpoBatchUndoControl batchId={batchId} actionId={e.actionId}/>:null}
 </li>)}</ol>}
 </main>;
}