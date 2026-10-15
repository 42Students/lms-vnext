import Link from "next/link";
import {batchHistoryViewSchema,filterTpoBatchHistoryKind} from "@/modules/placements/tpo-batch-history-view-model";
import { TpoBatchUndoControl } from "@/components/tpo/tpo-batch-undo-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listTpoBatchHistory } from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function BatchHistory({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{kind?:string|string[]}>}){
 const {batchId}=await params;
 const raw=await searchParams;
 const filters=batchHistoryViewSchema.safeParse({kind:Array.isArray(raw.kind)?raw.kind[0]:raw.kind});
 if(!filters.success)return <main role="alert">Invalid history filter. <Link href={"/tpo/batches/"+batchId+"/history"}>Reset</Link></main>;
 const {batch,events,ready}=await listTpoBatchHistory(await getCurrentRequestContext(),batchId);
 const visible=filterTpoBatchHistoryKind(events,filters.data.kind);
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{batch.name} — Decision history</h1>
 <Link href={"/tpo/batches/"+batchId} className="text-primary-text underline">Batch overview</Link>
 <p className="text-sm text-muted-foreground">Last 100 cohort-level eligibility events, newest first. Individual learner decisions are shown in the learner detail. Undo is permitted only when no later change makes the action stale.</p>
 <form method="get" action={"/tpo/batches/"+batchId+"/history"} className="flex flex-wrap items-end gap-3"><label className="text-sm">Event type<select name="kind" defaultValue={filters.data.kind} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All recorded events</option><option value="DECIDE">Decisions</option><option value="UNDO">Reversals</option></select></label><button type="submit" className="min-h-11 rounded bg-primary px-4 text-on-primary">Apply</button></form>
 <p className="text-xs text-muted-foreground">Showing {visible.length} of the latest {events.length} recorded cohort events.</p>
 {!ready?<p role="status" className="rounded border border-border p-4">Decision history migration has not been applied.</p>:visible.length===0?<p role="status">{events.length===0?"No cohort decisions recorded yet.":"No matching decisions in the latest recorded cohort events."}</p>:<ol className="space-y-2">{visible.map(e=><li className="min-w-0 break-words rounded border border-border bg-surface p-3 text-sm" key={e.id}>
 <strong>{e.kind==="UNDO"?"Undo":"Decision"}: {e.before??"NOT_DECIDED"} → {e.after??"NOT_DECIDED"}</strong>
 <p className="mt-1 text-xs text-muted-foreground">{e.occurredAt.toISOString()} · action {e.actionId}</p>
 {e.reversesActionId?<p className="text-xs">Reverses {e.reversesActionId}</p>:null}
 {e.kind==="DECIDE"?<TpoBatchUndoControl batchId={batchId} actionId={e.actionId}/>:null}
 </li>)}</ol>}
 </main>;
}