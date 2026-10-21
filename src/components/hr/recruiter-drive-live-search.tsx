"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

/** The old recruiter drive search updated while typing; results stay server-scoped. */
export function RecruiterDriveLiveSearch({initialQuery,currentHref}:{
  initialQuery:string;currentHref:string;
}){
  const router=useRouter();
  const [query,setQuery]=useState(initialQuery);
  useEffect(()=>setQuery(initialQuery),[initialQuery]);
  useEffect(()=>{
    if(query.trim()===initialQuery.trim())return;
    const timer=window.setTimeout(()=>{
      const url=new URL(currentHref,window.location.origin);
      url.searchParams.delete("page");
      if(query.trim())url.searchParams.set("q",query.trim());
      else url.searchParams.delete("q");
      router.replace(url.pathname+url.search,{scroll:false});
    },300);
    return ()=>window.clearTimeout(timer);
  },[query,initialQuery,currentHref,router]);
  return <div className="flex min-w-0 w-full flex-1 items-end gap-2 md:w-auto md:min-w-[180px]">
    <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      Search by role
      <Input type="search" name="q" value={query} maxLength={100}
        onChange={e=>setQuery(e.target.value)}
        aria-label="Search drives by role"
        placeholder="Search by role" className="min-h-11 w-full md:min-h-9"/>
    </label>
    {query?<button type="button" onClick={()=>setQuery("")}
      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9"
      aria-label="Clear drive search">Clear</button>:null}
  </div>;
}
