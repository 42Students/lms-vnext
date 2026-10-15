import Link from "next/link";
import { TpoBatchUndoControl } from "@/components/tpo/tpo-batch-undo-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listTpoBatchHistory } from "@/modules/placements/tpo-batch-workspace-read-service";
import { actionableBatchHistory } from "@/modules/placements/tpo-batch-history-undo-model";
export const dynamic="force-dynamic";
export default async function BatchHistory({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 const {batch,events,ready,limited,currentRosterOnly}=await listTpoBatchHistory(await getCurrentRequestContext(),batchId);
 const visible=actionableBatchHistory(events);
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{batch.name} — Decision history</h1>
 <Link href={"/tpo/batches/"+batchId} className="text-primary-text underline">Batch overview</Link>
 <p className="text-sm text-muted-foreground">Latest 100 batch, active-class and currently enrolled learner decisions. The newest unreversed cohort decision can be undone after a fresh server check.</p>
 {currentRosterOnly?<p className="text-xs text-muted-foreground">Learner and class history is scoped to the current active roster; historical transfers are not reconstructed.</p>:null}
 {limited?<p role="status" className="rounded border border-border p-3 text-sm">History is incomplete: only the first 500 active learners/classes and latest 100 events can be shown. Do not treat this as a complete audit.</p>:null}
 {!ready?<p role="status" className="rounded border border-border p-4">Decision history migration has not been applied.</p>:visible.length===0?<p role="status">No cohort decisions recorded yet.</p>:<ol className="space-y-2">{visible.map(e=><li className="min-w-0 break-words rounded border border-border bg-surface p-3 text-sm" key={e.id}>
 <strong>{e.kind==="UNDO"?"Undo":"Decision"}: {e.before??"NOT_DECIDED"} → {e.after??"NOT_DECIDED"}</strong>
 <p className="mt-1 text-xs text-muted-foreground">Scope: {e.scopeType.toLowerCase()} · {e.scopeId}</p>
 <p className="mt-1 text-xs text-muted-foreground">{e.occurredAt.toISOString()} · action {e.actionId}</p>
 {e.reversesActionId?<p className="text-xs">Reverses {e.reversesActionId}</p>:null}
 {e.canRequestUndo?<TpoBatchUndoControl batchId={batchId} actionId={e.actionId}/>:null}
 </li>)}</ol>}
 </main>;
}