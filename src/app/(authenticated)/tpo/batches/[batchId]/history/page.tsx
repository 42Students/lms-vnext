import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {PageHeader} from "@/components/ui/page-header";
import {batchDecisionLabel,batchHistoryDate} from "@/modules/placements/tpo-batch-labels-model";
import {tpoCohortHistoryCsvHref} from "@/modules/placements/tpo-batch-history-csv-model";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { TpoBatchWorkspaceTabs } from "@/components/tpo/tpo-batch-workspace-tabs";
import {batchHistoryViewSchema,filterTpoBatchHistoryOutcome} from "@/modules/placements/tpo-batch-history-view-model";
import {batchHistoryDecisionTimeline} from "@/modules/placements/tpo-batch-history-undo-model";
import { TpoBatchUndoControl } from "@/components/tpo/tpo-batch-undo-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listTpoBatchHistory } from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function BatchHistory({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{kind?:string|string[];after?:string|string[];show?:string|string[]}>}){
 const {batchId}=await params;
 const raw=await searchParams;
 const filters=batchHistoryViewSchema.safeParse({kind:Array.isArray(raw.kind)?raw.kind[0]:raw.kind,after:Array.isArray(raw.after)?raw.after[0]:raw.after});
 const showAll=raw.show==="100";
 if(raw.show!==undefined&&!showAll)return <div role="alert" className="min-w-0 space-y-3"><PageHeader title="Decision history"/><p>Invalid history depth.</p>
  <Link href={"/tpo/batches/"+batchId+"/history"} className="font-semibold text-link underline">Reset</Link></div>;
 if(!filters.success)return <div role="alert" className="min-w-0 space-y-3"><PageHeader title="Decision history"/><p>Invalid history filter.</p> <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]" href={"/tpo/batches/"+batchId+"/history"}>Reset</Link></div>;
 const {batch,events,ready}=await listTpoBatchHistory(await getCurrentRequestContext(),batchId);
 const recentEvents=showAll?events:events.slice(0,50);
 const annotated=batchHistoryDecisionTimeline(recentEvents,filters.data.kind);
 const visible=filterTpoBatchHistoryOutcome(annotated,filters.data.after);
 const historyParams=new URLSearchParams();
 if(filters.data.kind!=="ALL")historyParams.set("kind",filters.data.kind);
 if(filters.data.after!=="ALL")historyParams.set("after",filters.data.after);
 if(!showAll)historyParams.set("show","100");
 const toggleHref="/tpo/batches/"+encodeURIComponent(batchId)+"/history"+
   (historyParams.size?"?"+historyParams.toString():"");
 return <div className="min-w-0 space-y-4"><PageHeader title={batch.name+" — Decision history"} description="Review recorded eligibility decisions and undo availability." actions={<a href={tpoCohortHistoryCsvHref(batchId,filters.data)} className="lms-inline-link inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 text-sm text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto">Export matching latest-100 events CSV</a>}/>
 <TpoBatchWorkspaceTabs batchId={batchId} active="history" />
 <p className="max-w-[72ch] text-sm text-muted-foreground">Latest {showAll?"100":"50"} batch, class and learner eligibility decisions, newest first. Undo is permitted only when no later change makes the action stale.</p>
 {events.length>50?<Link href={toggleHref} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">{showAll?"Show latest 50":"Show up to 100 decisions"}</Link>:null}
 <form role="search" aria-label="history filters" method="get" action={"/tpo/batches/"+batchId+"/history"} className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Event type<Select name="kind" defaultValue={filters.data.kind} className="block min-h-11 w-full md:min-h-9"><option value="ALL">All recorded events</option><option value="DECIDE">Decisions</option><option value="UNDO">Reversals</option></Select></label><label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">After-state<Select name="after" defaultValue={filters.data.after} className="block min-h-11 w-full md:min-h-9"><option value="ALL">All outcomes</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option><option value="NOT_DECIDED">Not decided</option></Select></label><Button type="submit" className="min-h-11 w-full md:min-h-9 lg:w-auto">Apply</Button></form>
 <p className="text-xs text-muted-foreground">Showing {visible.length} of the latest {recentEvents.length} batch, class and learner events.</p>
 {!ready?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm">Decision history migration has not been applied.</p>:visible.length===0?<EmptyState title={events.length===0?"No decisions yet":"No decisions match these filters."} action={<Link href={"/tpo/batches/"+encodeURIComponent(batchId)+"/history"} className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Reset</Link>}/>:<ol aria-label="history entries" className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{visible.map(e=><li className="min-w-0 space-y-2 break-words py-4 text-sm" key={e.id}>
 <strong>Decision: {batchDecisionLabel(e.before)} → {batchDecisionLabel(e.after)}{e.undone?" · Undone":""}</strong>
 <p className="mt-1 text-xs text-muted-foreground">{batchHistoryDate(e.occurredAt)} · {e.actorName??"Unknown actor"} · {e.scopeType==="MEMBERSHIP"?"Learner":e.scopeType==="SECTION"?"Class":"Batch"} · {e.scopeId}</p>
 <p className="text-xs text-body">{e.afterReason??e.beforeReason??"No reason recorded"}</p>
 {e.canRequestUndo?<TpoBatchUndoControl batchId={batchId} actionId={e.actionId}/>:null}
 </li>)}</ol>}
 </div>;
}