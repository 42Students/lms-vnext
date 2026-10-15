import Link from "next/link";
import {TpoBatchLifecycleControl} from "@/components/tpo/tpo-batch-lifecycle-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getTpoBatch } from "@/modules/placements/tpo-batch-workspace-read-service";
import { PageHeader } from "@/components/ui/page-header";
export const dynamic="force-dynamic";
export default async function BatchPage({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;const {batch,lifecycle,ready}=await getTpoBatch(await getCurrentRequestContext(),batchId);
 const tabs=[{label:"Students",href:"students"},{label:"Rules",href:"rules"},{label:"History",href:"history"}] as const;
 return <main className="min-w-0 space-y-5"><PageHeader eyebrow="TPO · Batches" title={batch.name} description={batch.program+" · "+batch.department}/>
 <Link href="/tpo/batches" className="text-sm text-primary-text underline">All batches</Link>
 <p className="text-sm">Status: {!ready?"Lifecycle unavailable":lifecycle?.finishedAt?"Finished":lifecycle?.invitedAt?"Invited":"Preparing"}</p>
 {ready?<TpoBatchLifecycleControl batchId={batchId} state={lifecycle?{
  invitedAt:lifecycle.invitedAt?.toISOString()??null,finishedAt:lifecycle.finishedAt?.toISOString()??null,
  expectedVersion:lifecycle.updatedAt.toISOString(),
 }:null}/>:null}
 <nav aria-label="Batch workspace" className="flex flex-wrap gap-2">{tabs.map(tab=><Link key={tab.href} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm" href={"/tpo/batches/"+batchId+"/"+tab.href}>{tab.label}</Link>)}</nav>
 <p className="rounded border border-border p-4 text-sm">Choose Students to review participation, Rules for batch policy, or History for decisions and exact undo.</p>
 </main>;
}
