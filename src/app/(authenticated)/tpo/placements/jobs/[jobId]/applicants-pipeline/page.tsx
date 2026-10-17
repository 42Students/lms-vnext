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
 if(urlError)return <div className="space-y-4">
  <PageHeader eyebrow="TPO · Drive applicants" title="Invalid applicant filters"
   description="No private application records were loaded."/>
  <p role="alert" className="rounded-md border border-border p-4 text-sm">{urlError}</p>
  <Link href={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline"} className="font-semibold text-primary-text underline">Clear applicant filters</Link>
 </div>;
 const columns=first(query.columns)?.slice(0,800);
 const filters=parseTpoApplicantPipelineLink({jobId,
  stage:first(query.stage),search:first(query.search),page:first(query.page),
  channel:first(query.channel),eligibility:first(query.eligibility),flag:first(query.flag),
  sort:first(query.sort),submittedWithin:first(query.submittedWithin),
 });
 if(!filters.success)return <main className="space-y-4">
  <PageHeader eyebrow="TPO · Drive applicants" title="Invalid applicant filters"
    description="This URL contains unsupported applicant filters or page values. No applications were loaded."/>
  <Link href={tpoApplicantPipelineResetHref(jobId)} className="inline-flex min-h-11 items-center text-primary-text underline">
    Reset applicant filters
  </Link>
 </main>;
 const data=await getTpoApplicantPipeline(context,filters.data);
 const stages=["ALL","SUBMITTED","PENDING","HOLD","SHORTLISTED","REJECTED","WITHDRAWN"] as const;
 function pageHref(page:number){return {pathname:"/tpo/placements/jobs/"+jobId+"/applicants-pipeline",
  query:{stage:data.stage,search:data.search,channel:data.channel,eligibility:data.eligibility,flag:data.flag,sort:data.sort,submittedWithin:data.submittedWithin,...(columns?{columns}:{}),page}};}
 return <div className="space-y-6">
  <PageHeader eyebrow="TPO · Drive applicants" title={data.job.title}
   description="Current application and screening states from persisted records. Withdrawal is distinct from rejection."/>
  <Link href={"/tpo/placements/jobs/"+jobId} className="text-sm font-semibold text-primary-text hover:underline">← Drive</Link>
  <Link href={{pathname:"/tpo/placements/jobs/"+jobId+"/applications-export",query:{stage:data.stage,search:data.search,channel:data.channel,eligibility:data.eligibility,sort:data.sort,submittedWithin:data.submittedWithin}}}
   className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
   Review and export all matching applicants
  </Link>
  <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Applicant pipeline counts">
   {Object.entries(data.counts).map(([label,count])=>
    <div className="rounded-xl border border-border bg-surface p-3" key={label}>
      <p className="text-xs capitalize text-body">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-foreground">{count}</p>
    </div>)}
  </section>
  <form action={"/tpo/placements/jobs/"+jobId+"/applicants-pipeline"} method="get"
   className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
   {columns&&<input type="hidden" name="columns" value={columns}/>}
   <label className="min-w-40 flex-1 text-sm font-semibold text-body">Stage
    <select name="stage" defaultValue={data.stage} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
     {stages.map(s=><option key={s} value={s}>{s}</option>)}
    </select></label>
   <label className="min-w-40 flex-1 text-sm font-semibold text-body">Name, roll, branch, batch, email, phone or role
    <input name="search" defaultValue={data.search} maxLength={100}
     className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/></label>
   <label className="min-w-32 flex-1 text-sm font-semibold text-body">Application channel
    <select name="channel" defaultValue={data.channel} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="ALL">All channels</option><option value="INTERNAL">Internal</option><option value="EXTERNAL">External</option>
    </select></label>
   <label className="min-w-40 flex-1 text-sm font-semibold text-body">Eligibility evidence
    <select name="eligibility" defaultValue={data.eligibility} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="ALL">All evidence states</option><option value="ELIGIBLE">Eligible</option>
     <option value="ELIGIBLE_WITH_MISSING_EVIDENCE">Eligible · evidence missing</option>
    </select></label>
   <label className="min-w-40 flex-1 text-sm font-semibold text-body">Applicant flags
    <select name="flag" defaultValue={data.flag} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="ALL">Any flag</option>
     <option value="WITHDRAWAL_REQUESTED">Withdrawal requested</option>
     <option value="NO_SHOW">No-show</option>
     <option value="PLACED_ELSEWHERE">Accepted another offer</option>
     <option value="ADDED_BY_COLLEGE">Added by college</option>
    </select></label>
   <label className="min-w-32 flex-1 text-sm font-semibold text-body">Order by
    <select name="sort" defaultValue={data.sort} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="NEWEST">Recently submitted</option><option value="OLDEST">Earliest submitted</option>
     <option value="LEARNER_NAME">Learner name</option>
    </select></label>
   <label className="min-w-36 flex-1 text-sm font-semibold text-body">Submitted window
    <select name="submittedWithin" defaultValue={data.submittedWithin} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="ALL">Any submission date</option><option value="LAST_7_DAYS">Last 7 × 24 hours</option>
     <option value="LAST_30_DAYS">Last 30 × 24 hours</option>
    </select></label>
   <button type="submit" className="min-h-11 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary">Apply</button>
  </form>
  <p role="status" className="text-sm text-body">{data.totalMatching} matching applications · Page {data.page} of {data.totalPages}.
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
  {!data.rows.length?<div className="space-y-3">
    <EmptyState title="No matching applicants" description="No applicants match these filters. Clear the filters or check Registered, not applied to see who still needs to apply."/>
    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(jobId)+"#drive-registered-not-applied"} className="inline-flex min-h-11 items-center text-primary-text underline">Registered, not applied</Link>
    <Link href={tpoApplicantPipelineResetHref(jobId)} className="inline-flex min-h-11 items-center text-primary-text underline">Clear applicant filters</Link>
   </div>:
   <Suspense fallback={<p role="status">Loading applicant grid…</p>}>
    <TpoApplicationsSpreadsheet rows={data.rows} jobId={jobId} jobStatus={data.job.status}/>
   </Suspense>}
  <nav aria-label="Applicant pages" className="flex flex-wrap items-center justify-between gap-3">
   {data.page>1?<Link href={pageHref(data.page-1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Previous</Link>:<span/>}
   {data.page<data.totalPages?<Link href={pageHref(data.page+1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Next</Link>:null}
  </nav>
  <p className="text-xs text-body">This stage snapshot does not claim independent employer selection or share private screening comments.</p>
 </div>;
}
