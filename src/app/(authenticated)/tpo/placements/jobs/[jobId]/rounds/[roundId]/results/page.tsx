import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {TpoRoundResultEntryForm} from "@/components/placements/tpo-round-result-entry-form";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoRoundResultTable} from "@/modules/placements/tpo-round-result-table-service";
type Props={params:Promise<{jobId:string;roundId:string}>};
export default async function TpoRoundResultTablePage({params}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId,roundId}=await params;
 let data:Awaited<ReturnType<typeof getTpoRoundResultTable>>;
 try{data=await getTpoRoundResultTable(context,{jobId,roundId});}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_ROUND_NOT_FOUND")notFound();throw error;}
 return <div className="space-y-6">
  <Link href={"/tpo/placements/jobs/"+jobId} className="text-sm font-semibold text-primary-text hover:underline">← Drive workspace</Link>
  <PageHeader eyebrow="TPO · Round results" title={data.round.name}
   description={data.round.jobTitle+" · Stage outcomes for eligible shortlisted submitted applications."}/>
  <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Result counts">
   {Object.entries(data.counts).map(([label,n])=><div key={label} className="rounded-xl border border-border bg-surface p-3">
    <p className="text-xs capitalize text-body">{label}</p><p className="text-xl font-semibold tabular-nums">{n}</p>
   </div>)}
  </section>
  <p className="text-sm text-body">Staging results records a version and immutable audit. Applying staged outcomes to candidate progression requires a separate confirmed action. Applied outcomes are read-only here.</p>
  {data.truncated?<p role="status" className="text-sm text-body">Source capped at 500 application records; counts may be incomplete.</p>:null}
  {data.rows.length===0?<p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">No currently shortlisted submitted applicants for this round.</p>:
   <section className="grid gap-3" aria-label="Round result entries">
    {data.rows.map(row=><article key={row.applicationId} className="rounded-xl border border-border bg-surface p-4">
     <div className="mb-3">
      <h2 className="font-semibold text-foreground">{row.student??"Name unavailable"}</h2>
      <p className="text-sm text-body">{row.role} · {row.resultStatus??"No result"} · {row.outcome??"No outcome"}</p>
     </div>
     {row.editable?<TpoRoundResultEntryForm key={row.resultId??"unrecorded"} roundId={roundId} applicationId={row.applicationId}
      currentResultId={row.resultId}/>:
      <p className="text-sm text-body">Result entry is unavailable for this round or an already applied result.</p>}
    </article>)}
   </section>}
 </div>;
}
