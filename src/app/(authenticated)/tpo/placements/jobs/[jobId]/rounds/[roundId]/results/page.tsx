import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {TpoRoundResultEntryForm} from "@/components/placements/tpo-round-result-entry-form";
import {TpoRoundApplyControl} from "@/components/placements/tpo-round-apply-control";
import {TpoRoundResultsImport} from "@/components/placements/tpo-round-results-import";
import {TpoBulkRoundResultRecorder} from "@/components/placements/tpo-bulk-round-result-recorder";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoRoundResultTable} from "@/modules/placements/tpo-round-result-table-service";
import {tpoRoundResultViewSchema,filterTpoRoundResultRows} from "@/modules/placements/tpo-round-result-table-model";
type Props={params:Promise<{jobId:string;roundId:string}>;searchParams:Promise<{q?:string|string[];status?:string|string[]}>};
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
export default async function TpoRoundResultTablePage({params,searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId,roundId}=await params;
 const raw=await searchParams;
 const selected=tpoRoundResultViewSchema.safeParse({q:first(raw.q),status:first(raw.status)});
 if(!selected.success)return <Alert tone="error"><p>Invalid round result filters. No learner data loaded.</p><Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(roundId)+"/results"} className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">Clear filters</Link></Alert>;
 let data:Awaited<ReturnType<typeof getTpoRoundResultTable>>;
 try{data=await getTpoRoundResultTable(context,{jobId,roundId});}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_ROUND_NOT_FOUND")notFound();throw error;}
 const visibleRows=filterTpoRoundResultRows(data.rows,selected.data);
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">
  <Link href={"/tpo/placements/jobs/"+jobId} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">← Drive workspace</Link>
  <PageHeader eyebrow="TPO · Round results" title={data.round.name}
   description={data.round.jobTitle+" · Stage outcomes for eligible shortlisted submitted applications."}/>
  <section className="grid grid-cols-2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface sm:grid-cols-4" aria-label="Result counts">
   {Object.entries(data.counts).map(([label,n])=><div key={label} className="border-b border-border p-3 sm:border-r sm:border-b-0 sm:last:border-r-0">
    <p className="text-xs capitalize text-body">{label}</p><p className="text-xl font-semibold tabular-nums">{n}</p>
   </div>)}
  </section>
  {!data.truncated?<TpoBulkRoundResultRecorder roundId={roundId}
    round={{kind:data.round.kind,status:data.round.status}}
    rows={data.rows.map(row=>({applicationId:row.applicationId,
      displayName:row.student??"Learner",rollNumber:row.rollNumber,
      resultStatus:row.resultStatus}))}/>:
   <Alert tone="warning">Bulk staging is unavailable when the eligible roster exceeds 500. Use the reviewed result-import workflow instead.</Alert>}
  <TpoRoundResultsImport jobId={jobId} roundId={roundId}/>
  <TpoRoundApplyControl jobId={jobId} roundId={roundId}/>
  <p className="text-sm text-body">Staging results records a version and immutable audit. Applying staged outcomes to candidate progression requires a separate confirmed action. Applied outcomes are read-only here.</p>
  {data.truncated?<Alert tone="warning">Source capped at 500 application records; counts may be incomplete.</Alert>:null}
  <form method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4 max-[767px]:flex-col max-[767px]:items-stretch">
   <label className="min-w-0 flex-1 text-sm font-semibold text-body">Student or role
    <Input name="q" type="search" maxLength={100} defaultValue={selected.data.q} className="mt-1 block min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 md:min-h-9"/>
   </label>
   <label className="min-w-0 text-sm font-semibold text-body">Result state
    <Select name="status" defaultValue={selected.data.status} className="mt-1 block min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 md:min-h-9">
     <option value="ALL">All</option><option value="NOT_RECORDED">Not recorded</option><option value="STAGED">Staged</option><option value="APPLIED">Applied</option>
    </Select>
   </label>
   <Button type="submit" className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 text-primary-foreground md:min-h-9">Filter</Button>
  </form>
  <p role="status" className="text-sm text-body">{visibleRows.length} of {data.rows.length} eligible applications match these filters. Totals above describe the full round.</p>
  {visibleRows.length===0?<EmptyState title="No eligible shortlisted submitted applicants match this round result filter."/>:
   <section className="grid min-w-0 gap-[var(--lms-space-3)]" aria-label="Round result entries">
    {visibleRows.map(row=><article key={row.applicationId} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
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
