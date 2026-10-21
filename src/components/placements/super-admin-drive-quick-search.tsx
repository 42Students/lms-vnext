"use client";

import { useState } from "react";
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
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState<"ACTIVE"|"ALL">("ACTIVE");
  const pattern=query.trim().toLocaleLowerCase("en-IN");
  const matching=jobs.filter(job=>(filter==="ALL"||job.status==="PUBLISHED") &&
    (job.title.toLocaleLowerCase("en-IN").includes(pattern)||
      job.companyName.toLocaleLowerCase("en-IN").includes(pattern)));
  return <section aria-label="Find drives" className="space-y-3 border-b border-border pb-5">
    <h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Find a drive</h2>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid min-w-52 flex-1 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)]">Search by drive or company
        <Input type="search" value={query} onChange={e=>setQuery(e.target.value)}
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
    {matching.length?<div className="divide-y divide-border border-y border-border">
      {matching.slice(0,60).map(job=><article key={job.id} className="py-3">
        <p className="font-semibold">{job.title}</p>
        <p className="mt-1 text-sm text-body leading-[22px]">{job.companyName} · {job.status}</p>
        <p className="mt-1 text-xs text-muted-foreground leading-5">{job.applicants} submitted applications</p>
        <Link href={basePath+"/jobs/"+job.id}
          className="mt-2 inline-flex min-h-9 items-center font-semibold text-primary-text">Open drive →</Link>
      </article>)}
    </div>:<p className="text-sm text-muted-foreground leading-[22px]">No drives match your search and status.</p>}
    {matching.length>60?<p className="text-xs text-muted-foreground leading-5">
      Showing the first 60. Narrow the search to find another drive.
    </p>:null}
  </section>;
}
