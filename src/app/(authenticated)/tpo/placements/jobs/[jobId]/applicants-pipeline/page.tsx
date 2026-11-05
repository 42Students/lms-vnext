import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {Suspense} from "react";
import {TpoApplicationsSpreadsheet} from "@/components/tpo/tpo-applications-spreadsheet";
import {TpoDriveStudentsPrototypeReview} from "@/components/tpo/tpo-drive-students-prototype-review";
import {TpoBulkActionPanel} from "@/components/tpo/tpo-bulk-action-panel";
import {can} from "@/modules/permissions/policy";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getTpoApplicantPipeline } from "@/modules/placements/tpo-applicant-pipeline-service";
import {tpoApplicationFilterError} from "@/modules/placements/tpo-applications-url-guard";
type Props={params:Promise<{jobId:string}>;searchParams:Promise<{stage?:string|string[];search?:string|string[];query?:string|string[];page?:string|string[];channel?:string|string[];eligibility?:string|string[];flag?:string|string[];sort?:string|string[];submittedWithin?:string|string[];columns?:string|string[]}>};
import {parseTpoApplicantPipelineLink,tpoApplicantPipelineResetHref} from "@/modules/placements/tpo-applicant-pipeline-model";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
export default async function TpoApplicantPipelinePage({params,searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO")) redirect("/dashboard");
 const {jobId}=await params;
 const {query:legacyQuery,...modernQuery}=await searchParams;
 // Historical search-controller URLs used ?query=. Search is still scoped
 // to the current drive and college; duplicated aliases fail closed.
 const query={...modernQuery,search:modernQuery.search??legacyQuery};
 const urlError=modernQuery.search!==undefined&&legacyQuery!==undefined?
  "Use only one applicant search parameter.":tpoApplicationFilterError(query,jobId);
 if(urlError)return <div className="min-w-0 space-y-4">
  <PageHeader title="Invalid applicant filters"
   description="No private application records were loaded."/>
  <Alert tone="error">{urlError}</Alert>
  <Link href={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline"} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline focus-ring">Clear applicant filters</Link>
 </div>;
 const columns=first(query.columns)?.slice(0,800);
 const filters=parseTpoApplicantPipelineLink({jobId,
  stage:first(query.stage),search:first(query.search),page:first(query.page),
  channel:first(query.channel),eligibility:first(query.eligibility),flag:first(query.flag),
  sort:first(query.sort),submittedWithin:first(query.submittedWithin),
 });
 if(!filters.success)return <div className="min-w-0 space-y-4">
  <PageHeader title="Invalid applicant filters"
    description="This URL contains unsupported applicant filters or page values. No applications were loaded."/>
  <Alert tone="error">This URL contains unsupported applicant filters or page values. No applications were loaded.</Alert>
  <Link href={tpoApplicantPipelineResetHref(jobId)} className="inline-flex min-h-11 w-full items-center justify-center text-[var(--lms-teal-deep)] underline focus-ring md:w-auto">
    Reset applicant filters
  </Link>
 </div>;
 const data=await getTpoApplicantPipeline(context,filters.data);
 const stages=["ALL","SUBMITTED","PENDING","HOLD","SHORTLISTED","REJECTED","WITHDRAWN"] as const;
 function pageHref(page:number){return {pathname:"/tpo/placements/jobs/"+jobId+"/applicants-pipeline",
  query:{stage:data.stage,search:data.search,channel:data.channel,eligibility:data.eligibility,flag:data.flag,sort:data.sort,submittedWithin:data.submittedWithin,...(columns?{columns}:{}),page}};}
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">
  <PageHeader title={data.job.title}
   description="Current application and screening states from persisted records. Withdrawal is distinct from rejection."
   actions={<Link href={{pathname:"/tpo/placements/jobs/"+jobId+"/applications-export",query:{stage:data.stage,search:data.search,channel:data.channel,eligibility:data.eligibility,sort:data.sort,submittedWithin:data.submittedWithin}}}
    className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] focus-ring md:w-auto">Review and export all matching applicants</Link>}/>
  <nav aria-label="Applicants sub-sections" className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3 text-sm font-semibold">
   <span aria-current="page" className="inline-flex min-h-11 items-center border-b-2 border-primary px-3 text-[var(--lms-primary-text)]">Applicants</span>
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/not-applied"}
    className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-link hover:border-border">Registered, not applied</Link>
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"#drive-registered-not-applied"}
    className="inline-flex min-h-11 items-center px-3 text-link underline">Add to drive</Link>
  </nav>
  <section className="grid min-w-0 grid-cols-2 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 lg:grid-cols-4" aria-label="Applicant pipeline counts">
   {Object.entries(data.counts).map(([label,count])=>
    <div className="min-w-0 border-b border-[var(--lms-canvas-border)] px-1 py-3" key={label}>
      <p className="text-xs capitalize text-body leading-[20px]">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-foreground">{count}</p>
    </div>)}
  </section>
  <form action={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline"} method="get"
   className="grid min-w-0 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" aria-label="Filter applicants pipeline">
   {columns&&<input type="hidden" name="columns" value={columns}/>}
   <Label stack className="min-w-0">Stage
    <Select name="stage" defaultValue={data.stage} className="block min-h-11 w-full">
     {stages.map(s=><option key={s} value={s}>{s}</option>)}
    </Select></Label>
   <Label stack className="min-w-0">Name, roll, branch, batch, email, phone or role
    <Input name="search" defaultValue={data.search} maxLength={100}
     className="block min-h-11 w-full"/></Label>
   <Button type="submit" className="min-h-11 w-full lg:w-auto">Apply</Button>
   <Disclosure title={<>Filter applicants <span aria-hidden="true" className="ml-2">⌄</span></>} defaultOpen={data.channel !== "ALL" || data.eligibility !== "ALL" || data.flag !== "ALL" || data.sort !== "NEWEST" || data.submittedWithin !== "ALL"} className="col-span-full" preserveSummary summaryClassName="inline-flex min-h-11 items-center">
    <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
   <Label stack className="min-w-0">Application channel
    <Select name="channel" defaultValue={data.channel} className="block min-h-11 w-full">
     <option value="ALL">All channels</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
    </Select></Label>
   <Label stack className="min-w-0">Eligibility evidence
    <Select name="eligibility" defaultValue={data.eligibility} className="block min-h-11 w-full">
     <option value="ALL">All evidence states</option><option value="ELIGIBLE">Eligible</option>
     <option value="ELIGIBLE_WITH_MISSING_EVIDENCE">Eligible · evidence missing</option>
    </Select></Label>
   <Label stack className="min-w-0">Applicant flags
    <Select name="flag" defaultValue={data.flag} className="block min-h-11 w-full">
     <option value="ALL">Any flag</option>
     <option value="WITHDRAWAL_REQUESTED">Withdrawal requested</option>
     <option value="NO_SHOW">No-show</option>
     <option value="PLACED_ELSEWHERE">Accepted another offer</option>
     <option value="ADDED_BY_COLLEGE">Added by college</option>
    </Select></Label>
   <Label stack className="min-w-0">Order by
    <Select name="sort" defaultValue={data.sort} className="block min-h-11 w-full">
     <option value="NEWEST">Recently submitted</option><option value="OLDEST">Earliest submitted</option>
     <option value="LEARNER_NAME">Learner name</option>
    </Select></Label>
   <Label stack className="min-w-0">Submitted window
    <Select name="submittedWithin" defaultValue={data.submittedWithin} className="block min-h-11 w-full">
     <option value="ALL">Any submission date</option><option value="LAST_7_DAYS">Last 7 × 24 hours</option>
     <option value="LAST_30_DAYS">Last 30 × 24 hours</option>
    </Select></Label>
    </div>
   </Disclosure>
  </form>
  <p className="text-xs leading-5 text-muted-foreground">
   Applications and stage counts are read live from the current college-scoped drive; there is no cached snapshot to refresh.
   Organization-wide search and statistics are available only in the authorized Super Admin workspace,
   not by entering another organization ID here.
  </p>
  <p role="status" className="text-sm text-body leading-[22px]">{data.totalMatching} matching applications · Page {data.page} of {data.totalPages}.
   Stage counts cover all matching student/role records across every page.</p>
  <TpoDriveStudentsPrototypeReview rows={data.rows} jobId={jobId} jobStatus={data.job.status}
    totalMatching={data.totalMatching} counts={data.counts}/>
  {data.rows.length > 0 && context.membership &&
    can(context, "placements.manage", {collegeId: context.membership.collegeId}) ?
    <TpoBulkActionPanel
      key={["applications", jobId, data.page, data.stage, data.search, data.channel, data.eligibility, data.flag, data.sort, data.submittedWithin].join(":")}
      bulkTarget="APPLICATIONS" jobId={jobId}
      rows={data.rows.map((row) => ({
        id:row.id,label:(row.student ?? "Applicant") + " · " + row.role,
      }))}
      viewCount={data.totalMatching}
      {...(data.allFiltered != null ? { allRows: data.allFiltered.map(row=>({
        id:row.id,label:(row.student??"Applicant")+" · "+row.role,
      })) } : {})}
    /> : null}
  {!data.rows.length?<div className="flex min-w-0 flex-col gap-3">
    <EmptyState title="No matching applicants" description="No applicants match these filters. Clear the filters or check Registered, not applied to see who still needs to apply."/>
    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"#drive-registered-not-applied"} className="inline-flex min-h-11 w-full items-center justify-center text-[var(--lms-teal-deep)] underline focus-ring md:w-auto">Registered, not applied</Link>
    <Link href={tpoApplicantPipelineResetHref(jobId)} className="inline-flex min-h-11 w-full items-center justify-center text-[var(--lms-teal-deep)] underline focus-ring md:w-auto">Clear applicant filters</Link>
   </div>:
   <Suspense fallback={<Skeleton variant="row" count={4} label="Loading applicant grid…" />}>
    <TpoApplicationsSpreadsheet rows={data.rows} jobId={jobId} jobStatus={data.job.status}/>
   </Suspense>}
  <nav aria-label="Applicant pages" className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
   {data.page>1?<Link href={pageHref(data.page-1)} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:w-auto hover:bg-[color-mix(in_srgb,var(--lms-primary)_7%,transparent)] focus-ring">Previous</Link>:<span/>}
   {data.page<data.totalPages?<Link href={pageHref(data.page+1)} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:w-auto hover:bg-[color-mix(in_srgb,var(--lms-primary)_7%,transparent)] focus-ring">Next</Link>:null}
  </nav>
  <p className="text-xs text-body leading-[20px]">This stage snapshot does not claim independent employer selection or share private screening comments.</p>
 </div>;
}
