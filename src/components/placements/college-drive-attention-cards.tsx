"use client";
import {useState} from "react";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import type {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import {CollegeDriveDeadlineAction} from "./college-drive-deadline-action";
import {CollegeDriveDuplicateAction} from "./college-drive-duplicate-action";

type Attention=Awaited<ReturnType<typeof getCollegeDriveAttention>>;
const labels={
 STALE_APPLIED:"Applications with no action in a week",
 INTERVIEW_UNSCHEDULED:"Marked Interview, nothing scheduled",
 MISSING_OFFER_LETTER:"Offered, no offer letter attached",
 LOW_CONVERSION:"Closing soon, low conversion",
} as const;

function DateGlyph(){
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15"
  fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
  <rect x="3" y="5" width="18" height="16" rx="2"/>
  <path d="M7 3v4M17 3v4M3 10h18"/>
 </svg>;
}
function AttentionGlyph(){
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"
  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
  <path d="m12 3 10 18H2L12 3zM12 9v5M12 18h.01"/>
 </svg>;
}
function deadlineShort(value:Date|null){
 if(!value||!Number.isFinite(value.getTime()))return "—";
 return new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",
  timeZone:"Asia/Kolkata"}).format(value);
}

export function CollegeDriveAttentionCards({data}:{data:Attention}){
 const categories=Object.keys(labels) as (keyof typeof labels)[];
 const [expanded,setExpanded]=useState<Partial<Record<keyof typeof labels,boolean>>>({});
 const [search,setSearch]=useState("");
 const searchTerm=search.trim().toLocaleLowerCase("en-IN");
 // Only the latest 60 published college drives are in this preview.
 const visibleJobs=searchTerm?data.jobs.filter(job=>
  job.title.toLocaleLowerCase("en-IN").includes(searchTerm)||
  job.companyName.toLocaleLowerCase("en-IN").includes(searchTerm)):data.jobs;

 return <div className="min-w-0 space-y-5">
  <section aria-label="Needs attention" className="min-w-0 space-y-3">
   <h2 className="text-lg font-semibold">Needs attention ({data.total})</h2>
   {!data.categories.length?<Alert tone="success">
    <span role="status"><span aria-hidden="true">✓ </span>No drives currently flagged in this view.</span>
   </Alert>:categories.map(category=>{
    const rows=data.categories.filter(item=>item.category===category);
    if(!rows.length)return null;
    const shown=expanded[category]?rows:rows.slice(0,3);
    return <section key={category} aria-label={labels[category]}
      className="min-w-0 rounded-[8px] border border-[#fff1b8] border-l-4 border-l-[#faad14] bg-[#fffbe6] p-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#8d6300]">
       <AttentionGlyph/>{labels[category]} ({rows.length})
      </h3>
      <ul className="mt-3 divide-y divide-[#e6c35c]">
       {shown.map(row=><li key={row.jobId}
        className="flex min-w-0 flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
         <p className="break-words text-sm font-semibold text-foreground">{row.title}</p>
         <p className="text-xs text-body">{row.category==="LOW_CONVERSION"
           ?"1 drive flagged for low conversion":row.count.toLocaleString("en-IN")+" candidate(s) need review"}</p>
         {row.sampleOmitted>0?<p role="status" className="mt-1 text-xs text-muted-foreground">
          Showing {row.examples.length} sample{row.examples.length===1?"":"s"} of {row.countTotal} affected applications.
          {row.examples.length===0?" No named sample is available on this read.":""}
         </p>:null}
         {row.examples.length>0?<ul className="mt-2 space-y-1"
           aria-label={"Affected learners for "+row.title}>
           {row.examples.map(example=><li key={example.id} className="text-xs">
            <Link href={example.href} className="font-semibold text-link underline">
             {example.name} <span aria-hidden="true">›</span>
            </Link>
            <span className="ml-2 text-muted-foreground">{example.detail}</span>
           </li>)}
         </ul>:null}
        </div>
        <Link href={row.href} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-white px-3 text-sm font-semibold text-link md:min-h-9">
         Review applications
        </Link>
       </li>)}
      </ul>
      {rows.length>3?<button type="button" aria-expanded={Boolean(expanded[category])}
        onClick={()=>setExpanded(current=>({...current,[category]:!current[category]}))}
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link underline md:min-h-9">
        {expanded[category]?"Show less":"+"+(rows.length-3)+" more"}
      </button>:null}
    </section>;
   })}
   {!data.hasOfferLetterEvidence?<p className="text-xs text-muted-foreground">
    Missing-offer-letter counts require approved private offer-letter evidence storage;
    none are estimated in its absence.
   </p>:null}
  </section>

  <section className="min-w-0 space-y-4 border-t border-border pt-4" aria-label="Active drives">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
    <h2 className="text-lg font-semibold">Active drives ({data.activeDriveCount})</h2>
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <label className="min-w-0 w-full text-xs font-semibold text-muted-foreground sm:w-60">
        <span className="sr-only">Search active drives</span>
        <Input type="search" aria-label="Search active drives"
          value={search} maxLength={100} onChange={event=>setSearch(event.target.value)}
          placeholder="Search drives…" className="min-h-11 w-full md:min-h-9"/>
      </label>
      <Link href="/college/placements/new"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover md:min-h-9">
        New Drive
      </Link>
    </div>
   </div>
   {data.jobs.length>=60?<p role="status" className="text-xs text-muted-foreground">
    Search here filters the 60 newest active drives only.
    <Link href="/college/placements/drives" className="ml-1 font-semibold text-link underline">Search all drives</Link>.
   </p>:null}
   {visibleJobs.length?<div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {visibleJobs.map(job=>{
      const href="/college/placements/jobs/"+encodeURIComponent(job.id)+
        "/overview?returnTo=%2Fcollege%2Fplacements";
      return <article key={job.id}
        className="group relative min-h-[152px] min-w-0 rounded-[13px] border border-[#e5e9f0] bg-white p-4 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-[2px] hover:border-[#a8dfe5] hover:shadow-md focus-within:border-primary focus-within:shadow-md">
        <Link href={href} aria-label={"Open drive overview: "+job.title}
          className="absolute inset-0 rounded-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"/>
        <div className="pointer-events-none relative flex min-w-0 gap-3">
          <span aria-label={job.companyName+" avatar"}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-[#e6f6f8] text-sm font-bold text-[#0a7c88]">
            {job.companyName.trim().slice(0,2).toUpperCase()||"CO"}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground" title={job.title}>{job.title}</h3>
            <p className="mt-1 truncate text-xs text-body" title={job.companyName}>{job.companyName}</p>
          </div>
          {job.attention>0?<span title={job.attention+" attention item(s)"}
            aria-label={job.attention+" attention item(s) need action"}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fff1b8] text-xs font-bold text-[#ad6800]">
            {job.attention}
          </span>:null}
        </div>
        <div className="pointer-events-none relative mt-4 flex flex-wrap items-center gap-2 text-xs">
          {job.applicants>0?<span className="rounded border border-[#91caff] bg-[#e6f4ff] px-2 py-1 font-semibold text-[#0958d9]">
            {job.applicants} applicants
          </span>:<span className="text-muted-foreground">0 applicants</span>}
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <DateGlyph/>{deadlineShort(job.deadline)}
          </span>
        </div>
        <details className="relative z-10 mt-4 min-w-0">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-semibold text-link md:min-h-9">
            More <span aria-hidden="true">⋯</span>
          </summary>
          <div className="mt-2 flex min-w-0 flex-col gap-2 border-t border-border bg-white pt-3">
            <Link href={"/college/placements/jobs/"+encodeURIComponent(job.id)+"/applications"}
              className="inline-flex min-h-11 items-center text-xs font-semibold text-link underline md:min-h-9">
              Applications
            </Link>
            <CollegeDriveDuplicateAction jobId={job.id}/>
            <CollegeDriveDeadlineAction jobId={job.id} title={job.title}
              currentDeadline={job.deadline?.toISOString()??null}/>
          </div>
        </details>
      </article>;
    })}
   </div>:searchTerm?<div role="status" className="space-y-2 text-sm text-body">
    <p>No matching drives. Try a different drive or company name.</p>
    <Button type="button" variant="secondary" onClick={()=>setSearch("")}>Clear search</Button>
   </div>:<div role="status" className="space-y-2">
    <p className="font-semibold text-body">No active drives yet</p>
    <Link href="/college/placements/new"
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary md:min-h-9">
      Create your first drive
    </Link>
   </div>}
   <p className="flex justify-center pt-2">
    <Link href="/college/placements/drives?status=ALL"
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link underline md:min-h-9">
      All drives (including {data.inactiveDriveCount} closed/draft)
      <span aria-hidden="true">›</span>
    </Link>
   </p>
  </section>
 </div>;
}
