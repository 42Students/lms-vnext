import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { applicantStage } from "@/modules/placements/tpo-applicant-pipeline-model";
import { getTpoApplicantPipeline } from "@/modules/placements/tpo-applicant-pipeline-service";
import {TpoApplicantReviewDrawer} from "@/components/placements/tpo-applicant-review-drawer";
type Props={params:Promise<{jobId:string}>;searchParams:Promise<{stage?:string|string[];search?:string|string[];page?:string|string[];channel?:string|string[];eligibility?:string|string[];sort?:string|string[];submittedWithin?:string|string[]}>};
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
export default async function TpoApplicantPipelinePage({params,searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO")) redirect("/dashboard");
 const {jobId}=await params;const query=await searchParams;
 const data=await getTpoApplicantPipeline(context,{jobId,...(first(query.stage)?{stage:first(query.stage)}:{}),
   ...(first(query.search)?{search:first(query.search)}:{}),
   ...(first(query.channel)?{channel:first(query.channel)}:{}),
   ...(first(query.eligibility)?{eligibility:first(query.eligibility)}:{}),
   ...(first(query.sort)?{sort:first(query.sort)}:{}),
   ...(first(query.submittedWithin)?{submittedWithin:first(query.submittedWithin)}:{}),
   ...(first(query.page)?{page:first(query.page)}:{})});
 const stages=["ALL","SUBMITTED","PENDING","HOLD","SHORTLISTED","REJECTED","WITHDRAWN"] as const;
 function pageHref(page:number){return {pathname:"/tpo/placements/jobs/"+jobId+"/applicants-pipeline",
  query:{stage:data.stage,search:data.search,channel:data.channel,eligibility:data.eligibility,sort:data.sort,submittedWithin:data.submittedWithin,page}};}
 return <div className="space-y-6">
  <PageHeader eyebrow="TPO · Drive applicants" title={data.job.title}
   description="Current application and screening states from persisted records. Withdrawal is distinct from rejection."/>
  <Link href={"/tpo/placements/jobs/"+jobId} className="text-sm font-semibold text-primary-text hover:underline">← Drive</Link>
  <Link href={{pathname:"/tpo/placements/jobs/"+jobId+"/applications-export",query:{stage:data.stage,search:data.search,channel:data.channel,eligibility:data.eligibility,sort:data.sort,submittedWithin:data.submittedWithin}}}
   className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
   Preview capped applications CSV
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
   <label className="min-w-40 flex-1 text-sm font-semibold text-body">Stage
    <select name="stage" defaultValue={data.stage} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground">
     {stages.map(s=><option key={s} value={s}>{s}</option>)}
    </select></label>
   <label className="min-w-40 flex-1 text-sm font-semibold text-body">Student or role
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
  {!data.rows.length?<EmptyState title="No matching applicants" description="No stored applications match the selected stage and search."/>:
   <section className="grid gap-3" aria-label="Applicant records">
   {data.rows.map(a=><article key={a.id} className="rounded-xl border border-border bg-surface p-4">
     <h2 className="font-semibold text-foreground">{a.student??"Name unavailable"}</h2>
     <p className="mt-1 text-sm text-body">{a.role} · {applicantStage(a)} · Application {a.applicationStatus}</p>
     <p className="mt-1 text-xs text-body">Submitted {new Date(a.submittedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>
     <TpoApplicantReviewDrawer jobId={jobId} jobStatus={data.job.status} app={a}/>
     <Link href={"/tpo/placements/jobs/"+jobId+"/applicants/"+a.id}
       className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline">
       Open applicant detail →
     </Link>
   </article>)}</section>}
  <nav aria-label="Applicant pages" className="flex flex-wrap items-center justify-between gap-3">
   {data.page>1?<Link href={pageHref(data.page-1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Previous</Link>:<span/>}
   {data.page<data.totalPages?<Link href={pageHref(data.page+1)} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Next</Link>:null}
  </nav>
  <p className="text-xs text-body">This stage snapshot does not claim independent employer selection or share private screening comments.</p>
 </div>;
}
