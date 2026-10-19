import Link from "next/link";
import { Disclosure } from "@/components/ui/disclosure";
import type {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import {CollegeDriveDeadlineAction} from "./college-drive-deadline-action";
type Attention=Awaited<ReturnType<typeof getCollegeDriveAttention>>;
const labels={
 STALE_APPLIED:"Applications with no action in a week",
 INTERVIEW_UNSCHEDULED:"Marked Interview, nothing scheduled",
 LOW_CONVERSION:"Closing soon, low conversion",
} as const;
export function CollegeDriveAttentionCards({data}:{data:Attention}){
 const categories=Object.keys(labels) as (keyof typeof labels)[];
 return <div className="space-y-5">
  <section className="rounded-xl border border-border bg-surface p-5">
   <h2 className="text-lg font-semibold">Needs attention ({data.total})</h2>
   {!data.categories.length?<p className="mt-3 text-sm text-body">
    No drives currently flagged in this view.</p>:categories.map(category=>{
    const rows=data.categories.filter(item=>item.category===category);
    if(!rows.length)return null;
    return <div key={category} className="mt-4 space-y-2">
      <h3 className="font-semibold">{labels[category]} ({rows.length})</h3>
      <ul className="space-y-2">{rows.slice(0,3).map(row=><li key={row.jobId}
       className="flex flex-wrap items-center justify-between gap-3 rounded border border-border p-3">
       <div><p className="font-semibold">{row.title}</p>
        <p className="text-sm text-body">{row.count} candidate(s) need review</p></div>
       <Link href={row.href} className="min-h-11 rounded border border-border px-3 py-2 text-sm font-semibold text-primary-text">
        Review applications</Link>
      </li>)}</ul>
      {rows.length>3?<Disclosure title={`+${rows.length-3} more · Show more`} className="text-sm">
       <ul className="mt-2 space-y-2">{rows.slice(3).map(row=><li key={row.jobId}
        className="rounded border border-border p-3">
        <Link href={row.href} className="font-semibold text-primary-text underline">{row.title}</Link>
        <p>{row.count} candidate(s)</p></li>)}</ul>
       <p className="mt-2 text-xs text-muted-foreground">Showing {rows.length} of {rows.length}</p>
      </Disclosure>:null}
    </div>;
   })}
   {!data.hasOfferLetterEvidence?<p className="mt-4 text-xs text-muted-foreground">
    “Offered, no offer letter attached” cannot be verified until approved private offer-letter evidence storage is connected; no missing-letter count is invented.
   </p>:null}
  </section>
  <section className="rounded-xl border border-border bg-surface p-5">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-lg font-semibold">Active drives ({data.jobs.length})</h2>
    <Link href="/college/placements/drives?status=ALL"
     className="font-semibold text-primary-text underline">All drives</Link>
   </div>
   {data.jobs.length?<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {data.jobs.map(job=><article key={job.id} className="space-y-2 rounded-lg border border-border p-4">
     <h3 className="font-semibold">{job.title}</h3>
     <p className="text-sm">{job.applicants} applicants
      {job.attention>0?<span className="ml-2 font-semibold text-warning-text">
       {job.attention} attention item(s)</span>:null}</p>
     <p className="text-xs">Deadline: {job.deadline?
      new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(job.deadline):"Not specified"}</p>
     <div className="flex flex-wrap gap-2">
      <Link href={"/college/placements/jobs/"+job.id+"/applications"}
       className="min-h-11 rounded border border-border px-3 py-2 text-sm font-semibold text-primary-text">Applications</Link>
      <CollegeDriveDeadlineAction jobId={job.id} title={job.title}
       currentDeadline={job.deadline?.toISOString()??null}/>
     </div>
    </article>)}
   </div>:<p className="text-body">No active drives yet. Create your first drive.</p>}
  </section>
 </div>;
}
