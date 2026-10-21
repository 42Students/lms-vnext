"use client";

import { useState } from "react";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";

export type QuickDrive = {
  id: string; title: string; companyName: string; status: string;
  applicants: number;
};
export function SuperAdminDriveQuickSearch({jobs,basePath}:{
  jobs: readonly QuickDrive[]; basePath:string;
}) {
  const router=useRouter(),pathname=usePathname(),searchParams=useSearchParams();
  const [query,setQuery]=useState(()=>searchParams.get("q")?.trim().slice(0,100)??"");
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
    <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Find a drive</h2>
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
      {matching.length} of {jobs.length} drives
    </p>
    {matching.length?<div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {matching.slice(0,60).map(job=><article key={job.id}
        className="flex min-w-0 flex-col justify-between gap-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={job.status==="PUBLISHED"?"rounded-full bg-primary-subtle px-2 py-1 text-xs font-semibold text-primary-text":"rounded-full bg-surface-secondary px-2 py-1 text-xs font-semibold text-muted-foreground"}>
              {job.status==="PUBLISHED"?"Live":job.status}
            </span>
            {job.status==="PUBLISHED"&&job.applicants===0?
              <span className="text-xs font-semibold text-muted-foreground">No applications yet</span>:null}
          </div>
          <h3 className="mt-3 break-words text-base font-semibold text-foreground">{job.title}</h3>
          <p className="mt-1 break-words text-sm text-body">{job.companyName}</p>
          <p className="mt-3 text-sm text-muted-foreground">{job.applicants} submitted applications</p>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-border pt-3 text-sm font-semibold">
          <Link href={basePath+"/jobs/"+job.id} className="inline-flex min-h-9 items-center text-primary-text underline">Open drive</Link>
          <Link href={basePath+"/jobs/"+job.id+"/settings"} className="inline-flex min-h-9 items-center text-primary-text underline">Edit / extend</Link>
        </div>
      </article>)}
    </div>:<p className="text-sm text-muted-foreground leading-[22px]">No drives match your search and status.</p>}
    {matching.length>60?<p className="text-xs text-muted-foreground leading-5">
      Showing the first 60. Narrow the search to find another drive.
    </p>:null}
  </section>;
}
