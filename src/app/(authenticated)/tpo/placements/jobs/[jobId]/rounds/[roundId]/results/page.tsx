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
import {z} from "zod";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoRoundResultTable} from "@/modules/placements/tpo-round-result-table-service";
import {tpoRoundResultViewSchema,filterTpoRoundResultRows} from "@/modules/placements/tpo-round-result-table-model";
type Props={params:Promise<{jobId:string;roundId:string}>;searchParams:Promise<{q?:string|string[];status?:string|string[];page?:string|string[]}>};
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
export default async function TpoRoundResultTablePage({params,searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||
   !(hasMembershipRole(context,"TPO")||hasMembershipRole(context,"COLLEGE_ADMIN")))redirect("/dashboard");
 const {jobId,roundId}=await params;
 const raw=await searchParams;
 const selected=tpoRoundResultViewSchema.safeParse({q:first(raw.q),status:first(raw.status)});
 const requestedPage=z.coerce.number().int().min(1).max(10000).safeParse(first(raw.page)??"1");
 if(!selected.success||!requestedPage.success)return <Alert tone="error"><p>Invalid round result filters. No learner data loaded.</p><Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(roundId)+"/results"} className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link></Alert>;
 let data:Awaited<ReturnType<typeof getTpoRoundResultTable>>;
 try{data=await getTpoRoundResultTable(context,{jobId,roundId,page:requestedPage.data!});}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_ROUND_NOT_FOUND")notFound();throw error;}
 const visibleRows=filterTpoRoundResultRows(data.rows,selected.data);
 const pageHref=(number:number)=>{
  const params=new URLSearchParams();
  if(selected.data.q)params.set("q",selected.data.q);
  if(selected.data.status!=="ALL")params.set("status",selected.data.status);
  params.set("page",String(number));
  return "/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+
   encodeURIComponent(roundId)+"/results?"+params.toString();
 };
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader eyebrow="TPO · Round results" title={data.round.name}
   description={data.round.jobTitle+" · Stage outcomes for eligible shortlisted submitted applications."}
   actions={<Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-link-text)] md:w-auto underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">← Drive workspace</Link>} />
  <section className="grid grid-cols-2 overflow-hidden border border-border bg-surface md:grid-cols-4" aria-label="Result counts">
   {Object.entries(data.counts).map(([label,n])=><div key={label} className="min-w-0 border-b border-r border-border p-3 even:border-r-0 md:border-b-0 md:even:border-r md:last:border-r-0">
    <p className="text-xs capitalize text-[var(--lms-muted-text)] leading-5">{label}</p><p className="text-xl font-semibold tabular-nums">{n}</p>
   </div>)}
  </section>
  <TpoRoundApplyControl jobId={jobId} roundId={roundId}/>
  <details className="group min-w-0 border-b border-border pb-4">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">
      Bulk stage round results <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
    </summary>
    <div className="pt-3">
  <p className="mb-3 text-sm text-body">Stage results for this roster page (up to 500 learners). Move to another page for the remaining candidates.</p>
  <TpoBulkRoundResultRecorder roundId={roundId}
    round={{kind:data.round.kind,status:data.round.status}}
    rows={data.rows.map(row=>({applicationId:row.applicationId,
      displayName:row.student??"Learner",rollNumber:row.rollNumber,
      resultStatus:row.resultStatus}))}/>
    </div>
  </details>
  <details className="group min-w-0 border-b border-border pb-4">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">
      Import company round results <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
    </summary>
    <div className="pt-3">
  <TpoRoundResultsImport jobId={jobId} roundId={roundId}/>
    </div>
  </details>
  <p className="text-sm text-body leading-[22px]">Staging results records a version and immutable audit. Applying staged outcomes to candidate progression requires a separate confirmed action. Applied outcomes are read-only here.</p>
  {data.truncated?<Alert tone="info">Showing roster page {data.page} of {data.totalPages}; counts above include every eligible application. Filter and stage within each page.</Alert>:null}
  <form method="get" className="flex min-w-0 flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end" aria-label="Filter results">
   <label className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Student or role
    <Input name="q" type="search" maxLength={100} defaultValue={selected.data.q} className="mt-[6px] block min-h-11 w-full border border-border px-3 md:min-h-9"/>
   </label>
   <label className="min-w-0 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Result state
    <Select name="status" defaultValue={selected.data.status} className="mt-[6px] block min-h-11 border border-border px-3 md:min-h-9">
     <option value="ALL">All</option><option value="NOT_RECORDED">Not recorded</option><option value="STAGED">Staged</option><option value="APPLIED">Applied</option>
    </Select>
   </label>
   <Button type="submit" className="min-h-11 w-full rounded-[var(--lms-control-radius)] bg-primary px-4 text-primary-foreground sm:w-auto md:min-h-9">Filter</Button>
  </form>
  <p role="status" className="text-sm text-body leading-[1.6]">{visibleRows.length} of {data.rows.length} applications on this page match these filters. {data.counts.eligible} eligible applications across all pages.</p>
  <nav aria-label="Eligible applicant pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
    <span>Page {data.page} of {data.totalPages}</span>
    <div className="flex gap-4">
      {data.page>1?<Link href={pageHref(data.page-1)} className="font-semibold text-link underline">← Previous 500</Link>:null}
      {data.hasNext?<Link href={pageHref(data.page+1)} className="font-semibold text-link underline">Next 500 →</Link>:null}
    </div>
  </nav>
  {visibleRows.length===0?<EmptyState title="No eligible shortlisted submitted applicants match this round result filter."/>:
   <section className="min-w-0 divide-y divide-border border-y border-border" aria-label="Round result entries">
    {visibleRows.map(row=><article key={row.applicationId} className="min-w-0 py-[var(--lms-space-4)]">
     <div className="mb-3">
      <h2 className="break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">{row.student??"Name unavailable"}</h2>
      <p className="text-sm text-body leading-[22px]">{row.role} · {row.resultStatus??"No result"} · {row.outcome??"No outcome"}</p>
     </div>
     {row.editable?<details className="group min-w-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">
        Stage result <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
      </summary>
      <div className="pt-3"><TpoRoundResultEntryForm key={row.resultId??"unrecorded"} roundId={roundId} applicationId={row.applicationId}
        currentResultId={row.resultId}/></div>
     </details>:
      <p className="text-sm text-body leading-[22px]">Result entry is unavailable for this round or an already applied result.</p>}
    </article>)}
   </section>}
 </div>;
}
