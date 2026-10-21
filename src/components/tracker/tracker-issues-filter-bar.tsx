"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

type Filter={q:string;status:string;environment:string;reporter:string;severity:string;sort:string};
const reporters=["Akhila","Himaja","Mounika","Sadwik","Phanindra"];
export function TrackerIssuesFilterBar({initial,statuses,environments,severities}:{
 initial:Filter;statuses:readonly string[];environments:readonly string[];severities:readonly string[];
}){
 const router=useRouter();
 const [filters,setFilters]=useState(initial);
 const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{setFilters(initial);setHydrated(true);},[initial.q,initial.status,initial.environment,initial.reporter,initial.severity,initial.sort]);
 useEffect(()=>{
  if(!hydrated)return;
  if(filters.q===initial.q&&filters.status===initial.status&&
     filters.environment===initial.environment&&filters.reporter===initial.reporter&&
     filters.severity===initial.severity&&filters.sort===initial.sort)return;
  const incoming=new URLSearchParams();
  if(filters.q.trim())incoming.set("q",filters.q.trim());
  if(filters.status)incoming.set("status",filters.status);
  if(filters.environment)incoming.set("environment",filters.environment);
  if(filters.reporter)incoming.set("reporter",filters.reporter);
  if(filters.severity)incoming.set("severity",filters.severity);
  if(filters.sort!=="newest")incoming.set("sort",filters.sort);
  const timer=window.setTimeout(()=>{
   const desired=incoming.toString();
   const current=new URLSearchParams(window.location.search);
   current.delete("beforeId");current.delete("beforeCreatedAt");
   const canonical=new URLSearchParams([...current.entries()].sort(([a],[b])=>a.localeCompare(b)));
   const canonicalDesired=new URLSearchParams([...incoming.entries()].sort(([a],[b])=>a.localeCompare(b)));
   if(canonical.toString()===canonicalDesired.toString()&&
      !new URLSearchParams(window.location.search).has("beforeId"))return;
   router.replace("/tracker/issues"+(desired?"?"+desired:""),{scroll:false});
  },filters.q!==initial.q?300:0);
  return ()=>window.clearTimeout(timer);
 },[filters,hydrated,initial.q,initial.status,initial.environment,initial.reporter,initial.severity,initial.sort,router]);
 const update=(key:keyof Filter,value:string)=>setFilters(previous=>({...previous,[key]:value}));
 return <form method="get" action="/tracker/issues" role="search" aria-label="Issue filters"
   className="grid min-w-0 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 md:grid-cols-3 xl:grid-cols-[minmax(0,2fr)_repeat(5,minmax(120px,1fr))_auto] xl:items-end">
   <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--lms-neutral-400)]">Search
    <Input type="search" name="q" value={filters.q} onChange={e=>update("q",e.target.value)}
      placeholder="Search ID, description or page" maxLength={150} className="min-h-11 w-full md:min-h-9"/>
   </label>
   <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--lms-neutral-400)]">Status
    <Select name="status" value={filters.status} onChange={e=>update("status",e.target.value)} className="min-h-11 w-full md:min-h-9">
     <option value="">Status</option>
     {statuses.map(value=><option key={value} value={value}>{value.replaceAll("_"," ").toLowerCase().replace(/^./,char=>char.toUpperCase())}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--lms-neutral-400)]">Environment
    <Select name="environment" value={filters.environment} onChange={e=>update("environment",e.target.value)} className="min-h-11 w-full md:min-h-9">
     <option value="">Environment</option>
     {environments.map(value=><option key={value} value={value}>{value.toLowerCase().replace(/^./,char=>char.toUpperCase()).replace("_"," ")}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--lms-neutral-400)]">Reporter
    <Select name="reporter" value={filters.reporter} onChange={e=>update("reporter",e.target.value)} className="min-h-11 w-full md:min-h-9">
     <option value="">Reporter</option>
     {filters.reporter&&!reporters.includes(filters.reporter)?<option value={filters.reporter}>{filters.reporter}</option>:null}
     {reporters.map(value=><option key={value} value={value}>{value}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--lms-neutral-400)]">Severity
    <Select name="severity" value={filters.severity} onChange={e=>update("severity",e.target.value)} className="min-h-11 w-full md:min-h-9">
     <option value="">Severity</option>
     {severities.map(value=><option key={value} value={value}>{value.toLowerCase().replace(/^./,char=>char.toUpperCase())}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-1 text-xs font-semibold text-[var(--lms-neutral-400)]">Sort
    <Select name="sort" value={filters.sort} onChange={e=>update("sort",e.target.value)} className="min-h-11 w-full md:min-h-9">
     <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
    </Select>
   </label>
   <div className="flex min-w-0 items-center gap-2 xl:pb-0">
    <Button type="submit" className="min-h-11 md:min-h-9">Apply</Button>
    <Link href="/tracker/issues" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">Reset</Link>
   </div>
  </form>;
}
