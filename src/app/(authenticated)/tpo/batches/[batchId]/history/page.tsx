import Link from "next/link";
import { TpoBatchUndoControl } from "@/components/tpo/tpo-batch-undo-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listTpoBatchHistory } from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function BatchHistory({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 const {batch,events,ready}=await listTpoBatchHistory(await getCurrentRequestContext(),batchId);
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{batch.name} — Decision history</h1>
 <Link href={"/tpo/batches/"+batchId} className="text-primary-text underline">Batch overview</Link>
 <p className="text-sm text-muted-foreground">Last 100 cohort-level eligibility events, newest first. Individual learner decisions are shown in the learner detail. Undo is permitted only when no later change makes the action stale.</p>
 {!ready?<p role="status" className="rounded border border-border p-4">Decision history migration has not been applied.</p>:events.length===0?<p role="status">No cohort decisions recorded yet.</p>:<ol className="space-y-2">{events.map(e=><li className="min-w-0 break-words rounded border border-border bg-surface p-3 text-sm" key={e.id}>
 <strong>{e.kind==="UNDO"?"Undo":"Decision"}: {e.before??"NOT_DECIDED"} → {e.after??"NOT_DECIDED"}</strong>
 <p className="mt-1 text-xs text-muted-foreground">{e.occurredAt.toISOString()} · action {e.actionId}</p>
 {e.reversesActionId?<p className="text-xs">Reverses {e.reversesActionId}</p>:null}
 {e.kind==="DECIDE"?<TpoBatchUndoControl batchId={batchId} actionId={e.actionId}/>:null}
 </li>)}</ol>}
 </main>;
}