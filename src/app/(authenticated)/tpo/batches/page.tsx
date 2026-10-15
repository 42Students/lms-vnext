import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { listTpoBatches } from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
import { summarizeTpoBatchStates } from "@/modules/placements/tpo-batch-kpi-model";
import { batchDirectoryFilterSchema, filterTpoBatchDirectory, batchDirectoryState } from "@/modules/placements/tpo-batch-directory-filter-model";
export const dynamic="force-dynamic";

export default async function TpoBatchesPage({searchParams}:{searchParams:Promise<{q?:string|string[];state?:string|string[]}>}){
 const raw=await searchParams,parsed=batchDirectoryFilterSchema.safeParse({q:Array.isArray(raw.q)?raw.q[0]:raw.q,state:Array.isArray(raw.state)?raw.state[0]:raw.state});
 if(!parsed.success)return <div role="alert">Invalid search. <Link href="/tpo/batches">Clear search</Link></div>;
 const data=await listTpoBatches(await getCurrentRequestContext());
 const batches=filterTpoBatchDirectory(data.batches,data.ready?parsed.data:{...parsed.data,state:"ALL"});
 const summary=summarizeTpoBatchStates(data.batches);
 return <main className="min-w-0 space-y-5">
  <PageHeader eyebrow="TPO · Batches" title="Placement batches" description="Make placement eligibility decisions cohort by cohort. This list does not guess inherited learner eligibility."/>
  <form className="flex flex-wrap gap-2" action="/tpo/batches" method="get">
   <label className="min-w-0 flex-1 text-sm">Search batches<input type="search" name="q" defaultValue={parsed.data.q??""} maxLength={100} className="mt-1 block min-h-11 w-full rounded border border-border bg-surface px-3"/></label>
   <label className="text-sm">State<select name="state" defaultValue={parsed.data.state} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">All</option><option value="PLANNING">Planning</option><option value="INVITED">Invited</option><option value="FINISHED">Finished</option></select></label>
   <button type="submit" className="min-h-11 self-end rounded bg-primary px-4 text-on-primary">Search</button>
  </form>
  {!data.ready&&parsed.data.state!=="ALL"?<p role="status" className="text-sm">State filtering is unavailable until batch lifecycle storage is registered. Showing all matching batch names.</p>:null}
  {!data.ready?<p role="status" className="rounded border border-border p-3">Placement batch lifecycle migration is pending. Academic cohorts remain visible; invitation and completion status is unavailable.</p>:null}
  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[
  ["Total batches",summary.total],["Planning",summary.planning],["Invited",summary.invited],["Finished",summary.finished],
  ].map(([label,value])=><div key={label} className="rounded-lg border border-border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{data.ready?value:label==="Total batches"?value:"—"}</dd></div>)}</dl>
  <p className="text-sm text-muted-foreground">{batches.length} matching batches</p>
  {batches.length===0?<p role="status" className="rounded border border-border p-4">No matching batches.</p>:<ul className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">{batches.map(b=><li key={b.id} className="min-w-0 space-y-2 rounded-xl border border-border bg-surface p-4">
    <h2 className="break-words font-semibold">{b.name}</h2><p className="text-sm">{b.program} · {b.department}</p>
    <p className="text-xs text-muted-foreground">{data.ready?batchDirectoryState(b):"Lifecycle pending"}</p>
    <p className="text-sm text-muted-foreground">Eligibility split and journey counts: open Students to review verified records.</p>
    <Link href={"/tpo/batches/"+b.id} className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm font-semibold">Open batch</Link>
   </li>)}</ul>}
 </main>;
}
