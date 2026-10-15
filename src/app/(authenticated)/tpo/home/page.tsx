import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { listTpoBatches } from "@/modules/placements/tpo-batch-workspace-read-service";
import { buildTpoHomeAttention } from "@/modules/placements/tpo-home-attention-model";
import { PageHeader } from "@/components/ui/page-header";
export const dynamic="force-dynamic";
export default async function TpoHome(){
 const ctx=await getCurrentRequestContext();
 const batches=await listTpoBatches(ctx);
 const operations=await getPlacementTpoOperations(ctx,ctx.membership!.collegeId);
 const rows=buildTpoHomeAttention([
  {key:"BATCHES",label:"Batches to start",href:"/tpo/batches",count:batches.ready?batches.batches.filter(b=>!b.invitedAt&&!b.finishedAt).length:0},
  {key:"DRIVES",label:"Drives needing attention",href:"/tpo/placements/lifecycle",count:operations.summary.jobsNeedingAttention},
  {key:"APPLICANTS",label:"Applications awaiting screening",href:"/tpo/placements",count:operations.summary.pendingScreening},
  {key:"INTERVIEWS",label:"Round results to record",href:"/tpo/drive-day",count:operations.summary.stagedResults},
  {key:"OFFERS",label:"Issued offers",href:"/tpo/reports/offers-expiry",count:operations.summary.issuedOffers},
  {key:"JOINING",label:"Accepted offers awaiting joining",href:"/tpo/reports/joining-followups",count:operations.summary.acceptedPendingJoining},
 ]);
 const next=operations.workQueue[0];
 return <main className="min-w-0 space-y-5">
 <PageHeader eyebrow="TPO" title="Home" description="One next action and a quiet overview of the placement cell."/>
 <section className="min-w-0 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold">Next up</h2>
  {next?<div className="mt-2 space-y-2"><p className="break-words text-sm">{next.jobTitle} · {next.companyName}</p>
   <p className="text-xs text-muted-foreground">{next.count} {next.code.toLowerCase().replaceAll("_"," ")}</p>
   <Link href={"/tpo/placements/jobs/"+next.jobId} className="inline-flex min-h-11 items-center rounded bg-primary px-4 text-sm text-on-primary">Open drive</Link>
  </div>:rows.next?<div className="mt-2 space-y-2"><p className="text-sm">{rows.next.count} {rows.next.label.toLowerCase()}</p>
   <Link href={rows.next.href} className="inline-flex min-h-11 items-center rounded bg-primary px-4 text-sm text-on-primary">Go to next step</Link>
  </div>:<p className="mt-2 text-sm">Nothing is waiting on you in the currently supported queues.</p>}
 </section>
 {!batches.ready?<p className="text-xs text-muted-foreground">Batch attention is unavailable until its lifecycle migration is registered.</p>:null}
 <section className="space-y-2"><h2 className="font-semibold">Your placement work</h2>
  <ul className="divide-y divide-border rounded-xl border border-border bg-surface">{rows.rows.map(row=><li key={row.key} className="flex min-w-0 flex-wrap items-center justify-between gap-3 p-4">
    <div className="min-w-0 flex items-center gap-3"><span aria-hidden="true" className={row.needsAttention?"h-2.5 w-2.5 shrink-0 rounded-full bg-warning":"h-2.5 w-2.5 shrink-0 rounded-full bg-muted"}/>
    <span className="break-words text-sm">{row.label}</span></div>
    <Link href={row.href} className="min-h-10 inline-flex items-center text-sm text-primary-text underline">{row.count} · Open</Link>
   </li>)}</ul>
 </section>
 </main>;
}
