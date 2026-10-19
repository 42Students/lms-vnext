import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoBatchWorkspaceTabs} from "@/components/tpo/tpo-batch-workspace-tabs";
import {TpoBatchClassDecision} from "@/components/tpo/tpo-batch-class-decision";
import {listTpoBatchClassesForDecisions} from "@/modules/placements/tpo-batch-class-decision-service";
import {PageHeader} from "@/components/ui/page-header";
export const dynamic="force-dynamic";
export default async function TpoBatchClassesPage({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 const data=await listTpoBatchClassesForDecisions(await getCurrentRequestContext(),batchId);
 return <div className="space-y-5">
  <PageHeader eyebrow="TPO · Batches" title={"Classes · "+data.batch.name}
   description="Class decisions are inherited by students without a direct eligibility override."/>
  <Link href="/tpo/batches" className="font-semibold text-link underline">← All batches</Link>
  <TpoBatchWorkspaceTabs batchId={batchId} active="classes"/>
  {!data.ready?<p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3 text-sm">Batch lifecycle storage is unavailable. Decisions cannot be saved.</p>:null}
  {data.finished?<p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3 text-sm">This batch is finished. Eligibility decisions are read-only.</p>:null}
  <p className="text-sm text-muted-foreground">{data.classes.length} active classes · Whole batch: {data.inherited.replaceAll("_"," ").toLowerCase()}</p>
  {data.classes.length?<div className="grid gap-4 md:grid-cols-2">
   {data.classes.map(row=><section key={row.id} className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="text-base font-semibold">{row.name}</h2><p className="text-xs text-muted-foreground">{row.code} · {row.students} student{row.students===1?"":"s"}</p></div>
      <Link href={"/tpo/batches/"+encodeURIComponent(batchId)+"/students?classId="+encodeURIComponent(row.id)}
        className="inline-flex min-h-9 items-center font-semibold text-link underline">View students →</Link>
    </div>
    <p className="text-sm">Effective: <strong>{row.effectiveDecision.replaceAll("_"," ")}</strong>
     {row.decision==="NOT_DECIDED"?" · Follows the batch":" · Class override"}</p>
    {row.reason?<p className="text-xs text-muted-foreground">Reason: {row.reason}</p>:null}
    {data.ready?<TpoBatchClassDecision batchId={batchId} classId={row.id}
      initial={row.decision} expectedVersion={row.expectedVersion} finished={data.finished}/>:null}
   </section>)}
  </div>:<p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3 text-sm">No active classes exist in this batch.</p>}
  <p className="text-xs text-muted-foreground">An Eligible class does not override an explicit Ineligible student decision. A student with two active class assignments requires review rather than an inferred choice.</p>
 </div>;
}
