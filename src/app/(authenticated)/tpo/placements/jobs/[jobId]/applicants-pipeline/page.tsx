import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {Suspense} from "react";
import {TpoApplicationsSpreadsheet} from "@/components/tpo/tpo-applications-spreadsheet";
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
type Props={params:Promise<{jobId:string}>;searchParams:Promise<{stage?:string|string[];search?:string|string[];page?:string|string[];channel?:string|string[];eligibility?:string|string[];flag?:string|string[];sort?:string|string[];submittedWithin?:string|string[];columns?:string|string[]}>};
import {parseTpoApplicantPipelineLink,tpoApplicantPipelineResetHref} from "@/modules/placements/tpo-applicant-pipeline-model";
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
export default async function TpoApplicantPipelinePage({params,searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO")) redirect("/dashboard");
 const {jobId}=await params;const query=await searchParams;
 const urlError=tpoApplicationFilterError(query,jobId);
 if(urlError)return <div className="min-w-0 space-y-4">
  <PageHeader title="Invalid applicant filters"
   description="No private application records were loaded."/>
  <Alert tone="error">{urlError}</Alert>
  <Link href={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline"} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">Clear applicant filters</Link>
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
  <Link href={tpoApplicantPipelineResetHref(jobId)} className="inline-flex min-h-11 w-full items-center justify-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:w-auto">
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
    className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:w-auto">Review and export all matching applicants</Link>}/>
  <nav aria-label="Applicants sub-sections" className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3 text-sm font-semibold">
   <span aria-current="page" className="inline-flex min-h-11 items-center border-b-2 border-primary px-3 text-primary-text md:min-h-9">Applicants</span>
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/not-applied"}
    className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 text-link hover:border-border md:min-h-9">Registered, not applied</Link>
   <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"#drive-registered-not-applied"}
    className="inline-flex min-h-11 items-center px-3 text-link underline md:min-h-9">Add to drive</Link>
  </nav>
  <section className="grid min-w-0 grid-cols-2 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 min-[992px]:grid-cols-4" aria-label="Applicant pipeline counts">
   {Object.entries(data.counts).map(([label,count])=>
    <div className="min-w-0 border-b border-[var(--lms-canvas-border)] px-1 py-3" key={label}>
      <p className="text-xs capitalize text-body leading-[20px]">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-foreground">{count}</p>
    </div>)}
  </section>
  <form action={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline"} method="get"
   className="grid min-w-0 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 min-[768px]:grid-cols-2 min-[992px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" aria-label="Filter applicants pipeline">
   {columns&&<input type="hidden" name="columns" value={columns}/>}
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stage
    <Select name="stage" defaultValue={data.stage} className="block min-h-11 w-full min-[768px]:min-h-9">
     {stages.map(s=><option key={s} value={s}>{s}</option>)}
    </Select></label>
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name, roll, branch, batch, email, phone or role
    <Input name="search" defaultValue={data.search} maxLength={100}
     className="block min-h-11 w-full min-[768px]:min-h-9"/></label>
   <Button type="submit" className="min-h-11 w-full min-[768px]:min-h-9 min-[992px]:w-auto">Apply</Button>
   <details className="group col-span-full" open={data.channel !== "ALL" || data.eligibility !== "ALL" || data.flag !== "ALL" || data.sort !== "NEWEST" || data.submittedWithin !== "ALL"}>
    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">Filter applicants <span aria-hidden="true" className="ml-2">⌄</span></summary>
    <div className="mt-3 grid min-w-0 gap-3 min-[768px]:grid-cols-2 min-[1280px]:grid-cols-5">
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Application channel
    <Select name="channel" defaultValue={data.channel} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="ALL">All channels</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
    </Select></label>
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Eligibility evidence
    <Select name="eligibility" defaultValue={data.eligibility} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="ALL">All evidence states</option><option value="ELIGIBLE">Eligible</option>
     <option value="ELIGIBLE_WITH_MISSING_EVIDENCE">Eligible · evidence missing</option>
    </Select></label>
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Applicant flags
    <Select name="flag" defaultValue={data.flag} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="ALL">Any flag</option>
     <option value="WITHDRAWAL_REQUESTED">Withdrawal requested</option>
     <option value="NO_SHOW">No-show</option>
     <option value="PLACED_ELSEWHERE">Accepted another offer</option>
     <option value="ADDED_BY_COLLEGE">Added by college</option>
    </Select></label>
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Order by
    <Select name="sort" defaultValue={data.sort} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="NEWEST">Recently submitted</option><option value="OLDEST">Earliest submitted</option>
     <option value="LEARNER_NAME">Learner name</option>
    </Select></label>
   <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Submitted window
    <Select name="submittedWithin" defaultValue={data.submittedWithin} className="block min-h-11 w-full min-[768px]:min-h-9">
     <option value="ALL">Any submission date</option><option value="LAST_7_DAYS">Last 7 × 24 hours</option>
     <option value="LAST_30_DAYS">Last 30 × 24 hours</option>
    </Select></label>
    </div>
   </details>
  </form>
  <p role="status" className="text-sm text-body leading-[22px]">{data.totalMatching} matching applications · Page {data.page} of {data.totalPages}.
   Stage counts cover all matching student/role records across every page.</p>
  {data.rows.length > 0 && context.membership &&
    can(context, "placements.manage", {collegeId: context.membership.collegeId}) ?
    <TpoBulkActionPanel
      key={["applications", jobId, data.page, data.stage, data.search, data.channel, data.eligibility, data.flag, data.sort, data.submittedWithin].join(":")}
      target="APPLICATIONS" jobId={jobId}
      rows={data.rows.map((row) => ({
        id:row.id,label:(row.student ?? "Applicant") + " · " + row.role,
      }))}
      viewCount={data.totalMatching}
      allRows={data.allFiltered?.map(row=>({
        id:row.id,label:(row.student??"Applicant")+" · "+row.role,
      }))??undefined}
    /> : null}
  {!data.rows.length?<div className="flex min-w-0 flex-col gap-3">
    <EmptyState title="No matching applicants" description="No applicants match these filters. Clear the filters or check Registered, not applied to see who still needs to apply."/>
    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"#drive-registered-not-applied"} className="inline-flex min-h-11 w-full items-center justify-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:w-auto">Registered, not applied</Link>
    <Link href={tpoApplicantPipelineResetHref(jobId)} className="inline-flex min-h-11 w-full items-center justify-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:w-auto">Clear applicant filters</Link>
   </div>:
   <Suspense fallback={<Skeleton variant="row" count={4} label="Loading applicant grid…" />}>
    <TpoApplicationsSpreadsheet rows={data.rows} jobId={jobId} jobStatus={data.job.status}/>
   </Suspense>}
  <nav aria-label="Applicant pages" className="flex flex-col gap-3 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
   {data.page>1?<Link href={pageHref(data.page-1)} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] min-[768px]:min-h-9 min-[768px]:w-auto hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link>:<span/>}
   {data.page<data.totalPages?<Link href={pageHref(data.page+1)} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] min-[768px]:min-h-9 min-[768px]:w-auto hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link>:null}
  </nav>
  <p className="text-xs text-body leading-[20px]">This stage snapshot does not claim independent employer selection or share private screening comments.</p>
 </div>;
}
