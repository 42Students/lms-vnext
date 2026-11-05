"use client";
import {useState} from "react";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import type {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import {CollegeDriveDeadlineAction} from "./college-drive-deadline-action";
import {CollegeDriveDuplicateAction} from "./college-drive-duplicate-action";
import { Heading } from "@/components/ui/heading";

type Attention=Awaited<ReturnType<typeof getCollegeDriveAttention>>;
const labels={
 STALE_APPLIED:"Applications with no action in a week",
 INTERVIEW_UNSCHEDULED:"Marked Interview, nothing scheduled",
 MISSING_OFFER_LETTER:"Offered, no offer letter attached",
 LOW_CONVERSION:"Closing soon, low conversion",
} as const;

function DateGlyph(){
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"
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
 const categoryLabels={
  ...labels,
  STALE_APPLIED:"Applications with no action in "+
    data.lookbackDays+" day"+(data.lookbackDays===1?"":"s"),
 };
 const [expanded,setExpanded]=useState<Partial<Record<keyof typeof labels,boolean>>>({});
 const [search,setSearch]=useState("");
 const searchTerm=search.trim().toLocaleLowerCase("en-IN");
 // Only the latest 60 published college drives are in this preview.
 const visibleJobs=searchTerm?data.jobs.filter(job=>
  job.title.toLocaleLowerCase("en-IN").includes(searchTerm)||
  job.companyName.toLocaleLowerCase("en-IN").includes(searchTerm)):data.jobs;

 return <div className="min-w-0 space-y-5">
  <section aria-label="Needs attention" className="min-w-0 space-y-3">
   <Heading level={2} size="lg">Needs attention ({data.total})</Heading>
   {!data.categories.length?<Alert tone="success">
    <span role="status"><span aria-hidden="true">✓ </span>No drives currently flagged in this view.</span>
   </Alert>:categories.map(category=>{
    const rows=data.categories.filter(item=>item.category===category);
    if(!rows.length)return null;
    const shown=expanded[category]?rows:rows.slice(0,3);
    return <section key={category} aria-label={categoryLabels[category]}
      className="min-w-0 rounded-[8px] border border-[color:var(--lms-gold-subtle)] border-l-2 border-l-[color:var(--lms-icon-amber)] bg-[color:var(--lms-gold-subtle)] p-3">
      <Heading level={3} size="sm" className="flex items-center gap-2 text-[color:var(--lms-gold-accent)]">
       <AttentionGlyph/>{categoryLabels[category]} ({rows.length})
      </Heading>
      <ul className="mt-3 divide-y divide-[color:var(--lms-icon-amber)]">
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
        <Link href={row.href} className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-link md:min-h-9">
         Review applications
        </Link>
       </li>)}
      </ul>
      {rows.length>3?<Button variant="bare" type="button" aria-expanded={Boolean(expanded[category])}
        onClick={()=>setExpanded(current=>({...current,[category]:!current[category]}))}
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link underline md:min-h-9">
        {expanded[category]?"Show less":"+"+(rows.length-3)+" more"}
      </Button>:null}
    </section>;
   })}
   {!data.hasOfferLetterEvidence?<p className="text-xs text-muted-foreground">
    Missing-offer-letter counts require approved private offer-letter evidence storage;
    none are estimated in its absence.
   </p>:null}
  </section>

  <section className="min-w-0 space-y-4 border-t border-border pt-4" aria-label="Active drives">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
    <Heading level={2} size="lg">Active drives ({data.activeDriveCount})</Heading>
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
        className="group relative min-h-[152px] min-w-0 rounded-[12px] border border-[color:var(--lms-border)] bg-surface p-4 transition-[border-color,box-shadow,transform] duration-[var(--lms-motion-fast)] hover:-translate-y-[2px] hover:border-[color:var(--lms-primary-light)] hover:shadow-md focus-within:border-primary focus-within:shadow-md">
        <Link href={href} aria-label={"Open drive overview: "+job.title}
          className="absolute inset-0 rounded-[12px] focus-ring"/>
        <div className="pointer-events-none relative flex min-w-0 gap-3">
          <span aria-label={job.companyName+" avatar"}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-[color:var(--lms-primary-subtle)] text-sm font-bold text-[var(--lms-primary-text)]">
            {job.companyName.trim().slice(0,2).toUpperCase()||"CO"}
          </span>
          <div className="min-w-0 flex-1">
            <Heading level={3} size="sm" className="truncate text-foreground" title={job.title}>{job.title}</Heading>
            <p className="mt-1 truncate text-xs text-body" title={job.companyName}>{job.companyName}</p>
          </div>
          {job.attention>0?<span title={job.attention+" attention item(s)"}
            aria-label={job.attention+" attention item(s) need action"}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--lms-gold-subtle)] text-xs font-bold text-[color:var(--lms-gold-accent)]">
            {job.attention}
          </span>:null}
        </div>
        <div className="pointer-events-none relative mt-4 flex flex-wrap items-center gap-2 text-xs">
          {job.applicants>0?<span className="rounded border border-[color:var(--lms-border-strong)] bg-[color:var(--lms-info-blue-surface)] px-2 py-1 font-semibold text-[color:var(--lms-info-blue)]">
            {job.applicants} applicants
          </span>:<span className="text-muted-foreground">0 applicants</span>}
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <DateGlyph/>{deadlineShort(job.deadline)}
          </span>
        </div>
        <details className="relative z-(--lms-z-raised) mt-4 min-w-0">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-semibold text-link md:min-h-9">
            More <span aria-hidden="true">⋯</span>
          </summary>
          <div className="mt-2 flex min-w-0 flex-col gap-2 border-t border-border bg-surface pt-3">
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
