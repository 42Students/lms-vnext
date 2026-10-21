"use client";

import { useEffect, useState } from "react";
import {SuperAdminDriveDuplicate} from "@/components/placements/super-admin-drive-duplicate";
import {SuperAdminDriveDeadline} from "@/components/placements/super-admin-drive-deadline";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";

export type QuickDrive = {
  id: string; title: string; companyName: string; status: string;
  applicants: number;
  /** Optional when a list is projected from the full job service. */
  logoUrl?:string|null;deadline?:string|null;attentionCount?:number|null;
};
export function SuperAdminDriveQuickSearch({jobs,basePath}:{
  jobs: readonly QuickDrive[]; basePath:string;
}) {
  const router=useRouter(),pathname=usePathname(),searchParams=useSearchParams();
  const [query,setQuery]=useState(()=>searchParams.get("q")?.trim().slice(0,100)??"");
  useEffect(()=>{
    // Browser back/forward navigation owns the URL, not stale input state.
    const current=searchParams.get("q")?.slice(0,100)??"";
    setQuery(previous=>previous===current?previous:current);
  },[searchParams]);
  function updateQuery(value:string){
    const next=value.slice(0,100);setQuery(next);
    const params=new URLSearchParams(searchParams.toString());
    if(next.trim())params.set("q",next.trim());else params.delete("q");
    router.replace(pathname+(params.size?"?"+params.toString():""),{scroll:false});
  }
  const [filter,setFilter]=useState<"ACTIVE"|"ALL">("ACTIVE");
  const pattern=query.trim().toLocaleLowerCase("en-IN");
  const matching=jobs.filter(job=>(filter==="ALL"||job.status==="PUBLISHED") &&
    (job.title.toLocaleLowerCase("en-IN").includes(pattern)||
      job.companyName.toLocaleLowerCase("en-IN").includes(pattern)));
  return <section aria-label="Find drives" className="space-y-3 border-b border-border pb-5">
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
    <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Find a drive</h2>
    <Link href={basePath+"/drives"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:bg-primary-subtle md:min-h-9">View all drives →</Link>
    </div>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid min-w-52 flex-1 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">Search by drive or company
        <Input type="search" value={query} onChange={e=>updateQuery(e.target.value)} maxLength={100}
          placeholder="Search by drive or company"
          className="min-h-11 w-full sm:min-h-9" />
      </label>
      <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">Status
        <Select value={filter} onChange={e=>setFilter(e.target.value as "ALL"|"ACTIVE")}
          className="min-h-11 w-full sm:min-h-9">
          <option value="ACTIVE">Active drives</option><option value="ALL">All drives</option>
        </Select>
      </label>
    </div>
    <p role="status" aria-live="polite" className="text-xs text-muted-foreground leading-5">
      Showing {Math.min(matching.length,60)} of {matching.length} matching drives in this {jobs.length}-drive sampled list. Use View all drives for the complete directory.
    </p>
    {matching.length?<div className="grid min-w-0 gap-[var(--lms-space-4)] sm:grid-cols-2 min-[992px]:grid-cols-3">
      {matching.slice(0,60).map(job=>{
        const logoFallback=job.companyName.trim().split(/\s+/).slice(0,2)
         .map(part=>part.charAt(0).toUpperCase()).join("")||"CO";
        const deadline=job.deadline?new Date(job.deadline):null;
        const validDeadline=Boolean(deadline&&Number.isFinite(deadline.getTime()));
        const expired=Boolean(validDeadline&&deadline!.getTime()<Date.now());
        return <article key={job.id} className="group relative flex min-w-0 flex-col justify-between gap-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 transition hover:border-primary hover:shadow-sm focus-within:border-primary">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--lms-control-radius)] border border-border bg-primary-subtle text-xs font-bold text-primary-text" aria-label={job.companyName+" logo"}>
              {job.logoUrl?<img src={job.logoUrl} alt="" width={40} height={40} referrerPolicy="no-referrer" className="size-10 object-contain"/>:
               <span aria-hidden="true">{logoFallback}</span>}
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              <span className={job.status==="PUBLISHED"?(expired?"rounded-full bg-[#fff1f0] px-2 py-1 text-xs font-semibold text-[#cf1322]":"rounded-full bg-primary-subtle px-2 py-1 text-xs font-semibold text-primary-text"):"rounded-full bg-surface-secondary px-2 py-1 text-xs font-semibold text-muted-foreground"}>
               {job.status==="PUBLISHED"?(expired?"Expired":"Live"):job.status.toLowerCase().replace(/(^|\s)\S/g,s=>s.toUpperCase())}
              </span>
              {job.attentionCount!=null&&job.attentionCount>0?
               <span className="rounded-full border border-warning px-2 py-1 text-xs font-semibold text-warning">{job.attentionCount} attention</span>:null}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-base font-semibold text-foreground">
              <Link href={basePath+"/jobs/"+encodeURIComponent(job.id)} className="after:absolute after:inset-0 hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
               {job.title}
              </Link>
            </h3>
            <p className="mt-1 break-words text-sm text-body">{job.companyName}</p>
            <p className="mt-3 text-sm text-muted-foreground">{job.applicants} {job.applicants===1?"applicant":"applicants"}</p>
            {validDeadline?<p className={"mt-2 flex items-center gap-2 text-xs "+(expired?"text-error":"text-muted-foreground")}>
              <svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></svg>
              {expired?"Deadline passed: ":"Apply by "}
              {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(deadline!)} IST
            </p>:null}
          </div>
          <div className="relative z-10 flex min-w-0 flex-wrap items-center gap-3 border-t border-border pt-3 text-sm font-semibold">
            <Link href={basePath+"/jobs/"+encodeURIComponent(job.id)+"/applications"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Applications</Link>
            <Link href={basePath+"/jobs/"+encodeURIComponent(job.id)+"/settings"} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Edit</Link>
            <details className="ml-auto max-w-full">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-link focus-visible:outline-2 md:min-h-9" aria-label={"More actions for "+job.title}>
               <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
               <span className="sr-only">More actions</span>
              </summary>
              <div className="absolute right-0 z-20 mt-1 min-w-[240px] max-w-full space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3 shadow-lg">
                <SuperAdminDriveDuplicate jobId={job.id} title={job.title}/>
                <SuperAdminDriveDeadline jobId={job.id} deadline={job.deadline??null}/>
              </div>
            </details>
          </div>
        </article>;
      })}
    </div>:<div role="status" className="space-y-2 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6">
       <h3 className="font-semibold text-foreground">{jobs.every(job=>job.status!=="PUBLISHED")&&filter==="ACTIVE"&&!pattern?
        "No active drives yet":pattern?"No drives match your search":"No drives match this status"}</h3>
       <p className="text-sm text-body">{pattern?"Try a different search or clear the search field.":filter==="ACTIVE"?"Published drives will appear here once a drive is open.":"Use the full directory to find or create a drive."}</p>
       <Link href={basePath+"/drives"} className="inline-flex min-h-11 items-center font-semibold text-link underline">View all drives</Link>
    </div>}
    {matching.length>60?<p className="text-xs text-muted-foreground leading-5">
      Showing the first 60. Narrow the search to find another drive.
    </p>:null}
  </section>;
}
