import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoBatchWorkspaceTabs} from "@/components/tpo/tpo-batch-workspace-tabs";
import {TpoBatchClassDecision} from "@/components/tpo/tpo-batch-class-decision";
import {listTpoBatchClassesForDecisions} from "@/modules/placements/tpo-batch-class-decision-service";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
export const dynamic="force-dynamic";
export default async function TpoBatchClassesPage({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 const data=await listTpoBatchClassesForDecisions(await getCurrentRequestContext(),batchId);
 return <div className="space-y-5">
  <PageHeader title={"Classes · "+data.batch.name}
   description="Class decisions are inherited by students without a direct eligibility override."/>
  <Link href="/tpo/batches" className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">← All batches</Link>
  <TpoBatchWorkspaceTabs batchId={batchId} active="classes"/>
  {!data.ready?<Alert tone="warning">Batch lifecycle storage is unavailable. Decisions cannot be saved.</Alert>:null}
  {data.finished?<Alert tone="warning">This batch is finished. Eligibility decisions are read-only.</Alert>:null}
  <p className="text-sm text-muted-foreground">{data.classes.length} active classes · Whole batch: {data.inherited.replaceAll("_"," ").toLowerCase()}</p>
  {data.classes.length?<div className="grid min-w-0 gap-4 md:grid-cols-2">
   {data.classes.map(row=><section key={row.id} className="min-w-0 space-y-3 border-b border-border py-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="text-base font-semibold">{row.name}</h2><p className="text-xs text-muted-foreground">{row.code} · {row.students} student{row.students===1?"":"s"}</p></div>
      <Link href={"/tpo/batches/"+encodeURIComponent(batchId)+"/students?classId="+encodeURIComponent(row.id)}
        className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">View students →</Link>
    </div>
    <p className="text-sm">Effective: <strong>{row.effectiveDecision.replaceAll("_"," ")}</strong>
     {row.decision==="NOT_DECIDED"?" · Follows the batch":" · Class override"}</p>
    {row.reason?<p className="text-xs text-muted-foreground">Reason: {row.reason}</p>:null}
    {data.ready?<TpoBatchClassDecision batchId={batchId} classId={row.id}
      initial={row.decision} expectedVersion={row.expectedVersion} finished={data.finished}/>:null}
   </section>)}
  </div>:<EmptyState title="No active classes" description="No active classes exist in this batch."/>}
  <p className="text-xs text-muted-foreground">An Eligible class does not override an explicit Ineligible student decision. A student with two active class assignments requires review rather than an inferred choice.</p>
 </div>;
}
