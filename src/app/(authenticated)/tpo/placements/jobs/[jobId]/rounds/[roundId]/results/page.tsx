import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { ButtonLink } from "@/components/ui/button-link";
import { ROLE } from "@/modules/identity/roles";
type Props={params:Promise<{jobId:string;roundId:string}>;searchParams:Promise<{q?:string|string[];status?:string|string[];outcome?:string|string[];role?:string|string[];page?:string|string[]}>};
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
export default async function TpoRoundResultTablePage({params,searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||
   !(hasMembershipRole(context,ROLE.TPO)||hasMembershipRole(context,ROLE.COLLEGE_ADMIN)))redirect("/dashboard");
 const {jobId,roundId}=await params;
 const raw=await searchParams;
 const selected=tpoRoundResultViewSchema.safeParse({q:first(raw.q),status:first(raw.status)});
 const requestedPage=z.coerce.number().int().min(1).max(10000).safeParse(first(raw.page)??"1");
 const chosenOutcome=z.enum(["ALL","PASS","FAIL","HOLD","ABSENT"]).safeParse(first(raw.outcome)??"ALL");
 const chosenRole=z.string().trim().max(120).safeParse(first(raw.role)??"");
 if(!selected.success||!requestedPage.success||!chosenOutcome.success||!chosenRole.success)return <Alert tone="error"><p>Invalid round result filters. No learner data loaded.</p><TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(roundId)+"/results"} className="inline-flex min-h-11 items-center">Clear filters</TextLink></Alert>;
 let data:Awaited<ReturnType<typeof getTpoRoundResultTable>>;
 try{data=await getTpoRoundResultTable(context,{jobId,roundId,page:requestedPage.data!});}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_ROUND_NOT_FOUND")notFound();throw error;}
 // Use the full authorized roster page for name/roll search: the shared model
 // predates roll-number and role/outcome filters.
 const baseRows=filterTpoRoundResultRows(data.rows,{...selected.data,q:""});
 const term=selected.data.q.toLocaleLowerCase("en-IN");
 const visibleRows=baseRows.filter(row=>
  (!term||[row.student,row.rollNumber,row.role].some(value=>value?.toLocaleLowerCase("en-IN").includes(term)))&&
  (chosenOutcome.data==="ALL"||row.outcome===chosenOutcome.data)&&
  (!chosenRole.data||row.role===chosenRole.data));
 const availableRoles=[...new Set(data.rows.map(row=>row.role))].sort((a,b)=>a.localeCompare(b,"en-IN"));
 const pageHref=(number:number)=>{
  const params=new URLSearchParams();
  if(selected.data.q)params.set("q",selected.data.q);
  if(selected.data.status!=="ALL")params.set("status",selected.data.status);
  if(chosenOutcome.data!=="ALL")params.set("outcome",chosenOutcome.data);
  if(chosenRole.data)params.set("role",chosenRole.data);
  params.set("page",String(number));
  return "/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+
   encodeURIComponent(roundId)+"/results?"+params.toString();
 };
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader eyebrow="TPO · Round results" title={data.round.name}
   description={data.round.jobTitle+" · Stage outcomes for eligible shortlisted submitted applications."}
   actions={<ButtonLink variant="secondary" href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds"} className="w-full md:w-auto">← All rounds</ButtonLink>} />
  <section className="grid grid-cols-2 overflow-hidden border border-border bg-surface md:grid-cols-4" aria-label="Result counts">
   {Object.entries(data.counts).map(([label,n])=><div key={label} className="min-w-0 border-b border-r border-border p-3 even:border-r-0 md:border-b-0 md:even:border-r md:last:border-r-0">
    <p className="text-xs capitalize text-[var(--lms-muted-text)] leading-5">{label}</p><p className="text-xl font-semibold tabular-nums">{n}</p>
   </div>)}
  </section>
  <TpoRoundApplyControl jobId={jobId} roundId={roundId}/>
  <p className="text-sm text-body"><TextLink href="#bulk-round-results">Paste or select learner results ↓</TextLink> · <TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds"}>Round schedule and venue</TextLink></p>
  <Disclosure title={<>
      Bulk stage round results · paste rolls / select outcomes <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
    </>} defaultOpen id="bulk-round-results" className="min-w-0" preserveSummary summaryClassName="flex min-h-11 items-center justify-between gap-2">
    <div className="pt-3">
  <p className="mb-3 text-sm text-body">Stage results for this roster page (up to 500 learners). Move to another page for the remaining candidates.</p>
  <TpoBulkRoundResultRecorder roundId={roundId}
    round={{kind:data.round.kind,status:data.round.status}}
    rows={data.rows.map(row=>({applicationId:row.applicationId,
      displayName:row.student??"Learner",...(row.rollNumber===undefined?{}:{rollNumber:row.rollNumber}),
      resultStatus:row.resultStatus}))}/>
    </div>
  </Disclosure>
  <Disclosure title={<>
      Import company round results <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
    </>} className="min-w-0" preserveSummary summaryClassName="flex min-h-11 items-center justify-between gap-2">
    <div className="pt-3">
  <TpoRoundResultsImport jobId={jobId} roundId={roundId}/>
    </div>
  </Disclosure>
  <p className="text-sm text-body leading-[22px]">Staging results records a version and immutable audit. Applying staged outcomes to candidate progression requires a separate confirmed action. Applied outcomes are read-only here.</p>
  {data.truncated?<Alert tone="info">Showing roster page {data.page} of {data.totalPages}; counts above include every eligible application. Filter and stage within each page.</Alert>:null}
  <form method="get" className="flex min-w-0 flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end" aria-label="Filter results">
   <Label className="min-w-0 flex-1">Student, roll no. or role
    <Input name="q" type="search" maxLength={100} defaultValue={selected.data.q} className="mt-[6px] block min-h-11 w-full border border-border px-3 md:min-h-9"/>
   </Label>
   <Label className="min-w-0">Result state
    <Select name="status" defaultValue={selected.data.status} className="mt-[6px] block min-h-11 border border-border px-3 md:min-h-9">
     <option value="ALL">All</option><option value="NOT_RECORDED">Not recorded</option><option value="STAGED">Staged</option><option value="APPLIED">Applied</option>
    </Select>
   </Label>
   <Label className="min-w-0">Outcome
    <Select name="outcome" defaultValue={chosenOutcome.data} className="mt-[6px] block min-h-11 border border-border px-3 md:min-h-9">
     <option value="ALL">All outcomes</option><option value="PASS">Passed</option><option value="FAIL">Not selected</option><option value="HOLD">Waitlisted</option><option value="ABSENT">Absent</option>
    </Select>
   </Label>
   <Label className="min-w-0">Role
    <Select name="role" defaultValue={chosenRole.data} className="mt-[6px] block min-h-11 border border-border px-3 md:min-h-9">
     <option value="">All roles</option>{availableRoles.map(role=><option key={role} value={role}>{role}</option>)}
    </Select>
   </Label>
   <Button type="submit" className="min-h-11 w-full rounded-[var(--lms-control-radius)] bg-primary px-4 text-primary-foreground sm:w-auto md:min-h-9">Filter</Button>
  </form>
  <p role="status" className="text-sm text-body leading-[1.6]">{visibleRows.length} of {data.rows.length} applications on this page match these filters. {data.counts.eligible} eligible applications across all pages.</p>
  <p id="round-result-roster-scroll-hint" className="text-xs text-muted-foreground">The eligible roster displays up to 500 applicants per page in a scrollable list. Use Tab to focus the list and the arrow keys to scroll; move between pages below to stage the remaining eligible applications.</p>
  <nav aria-label="Eligible applicant pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
    <span>Page {data.page} of {data.totalPages}</span>
    <div className="flex gap-4">
      {data.page>1?<TextLink href={pageHref(data.page-1)}>← Previous 500</TextLink>:null}
      {data.hasNext?<TextLink href={pageHref(data.page+1)}>Next 500 →</TextLink>:null}
    </div>
  </nav>
  {visibleRows.length===0?<EmptyState title={data.counts.eligible===0?"No students are in this round yet.":"No students match these round result filters."}
   description={data.counts.eligible===0?"Eligible shortlisted students will appear here when applications are ready.":"Clear the search, role and outcome filters to see other applicants."}
   action={data.counts.eligible===0?<TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds"}>Back to rounds</TextLink>:<TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/rounds/"+encodeURIComponent(roundId)+"/results"}>Clear filters</TextLink>}/>:
   <section className="min-w-0 max-h-[420px] divide-y divide-border overflow-y-auto overscroll-contain border-y border-border focus-ring" role="region" aria-label="Round result entries, scrollable roster" aria-describedby="round-result-roster-scroll-hint" tabIndex={0}>
    {visibleRows.map(row=><article key={row.applicationId} className="min-w-0 py-[var(--lms-space-4)]">
     <div className="mb-3">
      <Heading level={2} size="base" className="break-words leading-6 text-[var(--lms-heading)]">{row.student??"Name unavailable"}</Heading>
      <p className="text-sm text-body leading-[22px]">{row.rollNumber?"Roll no. "+row.rollNumber+" · ":""}{row.role} · {row.resultStatus??"No result"} · {row.outcome??"No outcome"}</p>
      <TextLink href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/applicants/"+encodeURIComponent(row.applicationId)+"#applicant-detail"}
       aria-label={"Open applicant details for "+(row.student??"learner")}
       className="mt-2 inline-flex min-h-11 items-center text-sm md:min-h-9">
       View applicant details →
      </TextLink>
     </div>
     {row.editable?<Disclosure title={<>
        Stage result <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
      </>} className="min-w-0" preserveSummary summaryClassName="flex min-h-11 items-center justify-between gap-2">
      <div className="pt-3"><TpoRoundResultEntryForm key={row.resultId??"unrecorded"} roundId={roundId} applicationId={row.applicationId}
        currentResultId={row.resultId}/></div>
     </Disclosure>:
      <p className="text-sm text-body leading-[22px]">Result entry is unavailable for this round or an already applied result.</p>}
    </article>)}
   </section>}
 </div>;
}
