"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {safeTpoFindResult, type TpoFindResult} from "@/components/shell/topbar/tpo-find-model";

type Suggestion=TpoFindResult;
const groups=["Recruiter Leads","Drives","Students","Companies"] as const;

/** Old /tpo/search contract: minimum two characters and five matches from
 * each of four categories. The API does the persisted TPO/college scope check. */
export function TpoFourEntitySearch({initialQuery=""}:{initialQuery?:string}){
 const [query,setQuery]=useState(initialQuery.slice(0,100));
 const [results,setResults]=useState<Suggestion[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState(false);
 const [retry,setRetry]=useState(0);
 const term=query.trim();
 useEffect(()=>{
  if(term.length<2){setResults([]);setLoading(false);setError(false);return;}
  const controller=new AbortController();
  setLoading(true);setError(false);
  const timer=window.setTimeout(()=>{
   void fetch("/api/tpo/find-suggestions?q="+encodeURIComponent(term),{
    signal:controller.signal,credentials:"same-origin",cache:"no-store",
   }).then(async response=>{
    if(!response.ok)throw new Error("Search unavailable");
    return response.json() as Promise<{results:Suggestion[]}>;
   }).then(payload=>{
    if(controller.signal.aborted)return;
    setResults((Array.isArray(payload.results)?payload.results:[])
      .filter(item=>groups.some(group=>group===item.group))
      .filter(safeTpoFindResult).slice(0,20));
   }).catch(()=>{if(!controller.signal.aborted){setError(true);setResults([]);}})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  },250);
  return()=>{window.clearTimeout(timer);controller.abort();};
 },[term,retry]);
 return <section className="min-w-0 space-y-3 border-b border-border bg-surface px-3 py-4"
   aria-label="Search all placement records">
  <label className="grid max-w-xl gap-2 text-sm font-semibold text-foreground">
    Search recruiters, drives, students and companies
    <Input value={query} onChange={event=>setQuery(event.target.value.slice(0,100))}
      type="search" maxLength={100} placeholder="Search at least 2 characters"
      aria-label="Search recruiter leads, drives, students and companies"/>
  </label>
  <div className="flex flex-wrap items-center gap-3">
    <p role="status" className="text-xs text-muted-foreground">
      {term.length<2?"Enter at least 2 characters to search all four categories.":
       loading?"Searching college records…":error?"Search failed. You can retry.":
       results.length+" matching result(s) across four categories"}
    </p>
    {error?<Button type="button" variant="secondary" size="sm"
      onClick={()=>setRetry(value=>value+1)}>Retry search</Button>:null}
  </div>
  {term.length>=2&&!loading&&!error?<div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
    {groups.map(group=><section key={group} className="min-w-0 border border-border bg-surface p-3">
      <h2 className="text-sm font-semibold text-foreground">{group}</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {results.filter(item=>item.group===group).slice(0,5).map(item=><li key={item.href+item.label}>
          <Link href={item.href} className="inline-flex min-h-9 min-w-0 items-center break-words font-medium text-primary-text underline">
            {item.label}
          </Link>
        </li>)}
        {!results.some(item=>item.group===group)?<li className="text-xs text-muted-foreground">No matches</li>:null}
      </ul>
    </section>)}
  </div>:null}
 </section>;
}
