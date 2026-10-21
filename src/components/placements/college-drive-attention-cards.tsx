"use client";
import {useState} from "react";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import type {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import {CollegeDriveDeadlineAction} from "./college-drive-deadline-action";
import {CollegeDriveDuplicateAction} from "./college-drive-duplicate-action";
type Attention=Awaited<ReturnType<typeof getCollegeDriveAttention>>;
const labels={
 STALE_APPLIED:"Applications with no action in a week",
 INTERVIEW_UNSCHEDULED:"Marked Interview, nothing scheduled",
 LOW_CONVERSION:"Closing soon, low conversion",
} as const;
export function CollegeDriveAttentionCards({data}:{data:Attention}){
 const categories=Object.keys(labels) as (keyof typeof labels)[];
 const [search,setSearch]=useState("");
 const searchTerm=search.trim().toLocaleLowerCase("en-IN");
 // Source caps the latest PUBLISHED drives at 60. Do not claim the
 // filtered results are an exhaustive search of older drives.
 const visibleJobs=searchTerm
  ?data.jobs.filter(job=>job.title.toLocaleLowerCase("en-IN").includes(searchTerm))
  :data.jobs;
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <section className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
   <h2 className="text-lg font-semibold">Needs attention ({data.total})</h2>
   {!data.categories.length?<p role="status" className="mt-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] p-3 text-sm text-body">
    <span aria-hidden="true">✓ </span>No drives currently flagged in this view.</p>:categories.map(category=>{
    const rows=data.categories.filter(item=>item.category===category);
    if(!rows.length)return null;
    return <div key={category} className="mt-4 space-y-2">
      <h3 className="font-semibold">{labels[category]} ({rows.length})</h3>
      <ul className="space-y-2">{rows.slice(0,3).map(row=><li key={row.jobId}
       className="flex min-w-0 flex-col items-stretch justify-between gap-[var(--lms-space-3)] border-b border-border py-[var(--lms-space-3)] sm:flex-row sm:items-center">
       <div className="min-w-0 break-words [overflow-wrap:anywhere]"><p className="font-semibold">{row.title}</p>
        <p className="text-sm text-body">{row.count} candidate(s) need review</p></div>
       <Link href={row.href} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-semibold text-primary-text sm:w-auto md:min-h-9">
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
  <section className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-lg font-semibold">Active drives ({data.jobs.length})</h2>
    <Link href="/college/placements/drives?status=ALL"
     className="font-semibold text-primary-text underline">All drives</Link>
   </div>
   <label className="mb-3 grid max-w-xl gap-1 text-sm font-semibold text-body">
    Search drives
    <Input type="search" value={search} maxLength={100}
     onChange={event=>setSearch(event.target.value)} placeholder="Search a drive title" />
   </label>
   {data.jobs.length>=60?<p role="status" className="mb-3 text-xs text-muted-foreground">
    Showing at most the 60 newest active drives. Search here filters only these results;
    <Link href="/college/placements/drives" className="ml-1 text-link underline">search all drives</Link>.
   </p>:null}
   {visibleJobs.length?<div className="grid min-w-0 gap-[var(--lms-space-3)] sm:grid-cols-2 xl:grid-cols-3">
    {visibleJobs.map(job=><article key={job.id} className="relative min-w-0 space-y-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)]">
     <Link href={"/college/placements/jobs/"+encodeURIComponent(job.id)+"/overview?returnTo=%2Fcollege%2Fplacements"}
      aria-label={"Open drive overview: "+job.title}
      className="absolute inset-0 rounded-[var(--lms-control-radius)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
     <h3 className="pointer-events-none relative break-words [overflow-wrap:anywhere] font-semibold text-link underline">
      {job.title}
     </h3>
     <p className="text-sm">{job.applicants} applicants
      {job.attention>0?<span className="ml-2 font-semibold text-warning-text">
       {job.attention} attention item(s)</span>:null}</p>
     <p className="text-xs">Deadline: {job.deadline?
      new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(job.deadline):"Not specified"}</p>
     <div className="relative z-10 flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap">
      <Link href={"/college/placements/jobs/"+job.id+"/applications"}
       className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-semibold text-primary-text sm:w-auto md:min-h-9">Applications</Link>
      <details className="relative min-w-0">
       <summary className="min-h-11 cursor-pointer rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-semibold text-primary-text md:min-h-9">
        More actions
       </summary>
       <div className="mt-2 flex min-w-0 flex-col gap-2 rounded-[var(--lms-control-radius)] border border-border bg-white p-2">
        <CollegeDriveDuplicateAction jobId={job.id}/>
        <CollegeDriveDeadlineAction jobId={job.id} title={job.title}
         currentDeadline={job.deadline?.toISOString()??null}/>
       </div>
      </details>
     </div>
    </article>)}
   </div>:searchTerm?<div role="status" className="space-y-2 text-sm text-body">
    <p>Try a different drive or company name, or clear the current search.</p>
    <Button type="button" variant="secondary" onClick={()=>setSearch("")}>Clear search</Button>
   </div>:<div className="space-y-2" role="status">
    <p className="font-semibold text-body">No active drives yet</p>
    <Link href="/college/placements/new" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary md:min-h-9">Create your first drive</Link>
   </div>}
  </section>
 </div>;
}
